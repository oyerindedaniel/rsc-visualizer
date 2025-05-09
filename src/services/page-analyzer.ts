import { Page, CDPSession, Protocol } from "puppeteer";
import logger from "@/utils/logger";
import { puppeteerService } from "./puppeteer-service";
import { NAVIGATION_TIMEOUT } from "@/app/config/app";
import { normalizeAppError } from "@/utils/errors";
import { rscParser } from "./rsc-parser";
import type {
  PageAnalysisResult,
  RSCAnalysisResult,
  NetworkResourceTiming,
} from "@/types/analysis";
import {
  getResourceType,
  isRSCResource,
  isJSChunk,
  predictResourceCacheBehavior,
} from "@/utils/resource-utils";

interface RequestData {
  url: string;
  method: string;
  resourceType: string;
  startTime: number; // CDP timestamp (s)
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  statusCode?: number;
  encodedDataLength?: number;
  decodedBodySize?: number; // For getResponseBody
  nextHopProtocol?: string;
  endTime?: number; // CDP timestamp (s)
  isRSC?: boolean; // Tentative RSC flag
}

/**
 * Page Analyzer Service: Analyzes initial page load, detects Next.js & RSC,
 * and collects network/payload data.
 */
export class PageAnalyzerService {
  /**
   * Analyzes a given URL for Next.js, RSC, and collects detailed load data.
   *
   * @param url The URL to analyze
   * @param forceFresh Whether to force a fresh analysis and ignore cached data
   * @returns Promise resolving to a PageAnalysisResult
   */
  public async analyzeUrl(
    url: string,
    forceFresh = false
  ): Promise<PageAnalysisResult> {
    logger.debug(`Analyzing URL: ${url} (forceFresh: ${forceFresh})`);
    const normalizedUrl = this.normalizeUrl(url);

    const result: PageAnalysisResult = {
      isReachable: false,
      isNextJs: false,
      hasRSC: false,
      details: [],
    };
    let page: Page | null = null;
    let client: CDPSession | null = null;

    const networkResources: NetworkResourceTiming[] = [];
    const jsChunks: { url: string; size: number; loadTime: number }[] = [];
    const rscPayloadContents: string[] = [];
    const requestDataMap = new Map<string, RequestData>();
    const initialRscUrlHits: string[] = [];
    const scriptSourcesDuringLoad: string[] = [];

    try {
      page = await puppeteerService.newPage();
      client = await page.createCDPSession();

      await client.send("Performance.enable");
      await client.send("Network.enable");

      // Disable browser cache if we're forcing fresh data
      //   if (forceFresh) {
      //     logger.debug(
      //       "[PageAnalyzer] Disabling browser cache due to forceFresh=true"
      //     );
      //     await client.send("Network.setCacheDisabled", { cacheDisabled: true });
      //   }

      client.on(
        "Network.requestWillBeSent",
        (params: Protocol.Network.RequestWillBeSentEvent) => {
          requestDataMap.set(params.requestId, {
            url: params.request.url,
            method: params.request.method,
            startTime: params.timestamp,
            resourceType: params.type?.toLowerCase() || "unknown",
            requestHeaders: params.request.headers,
          });

          if (params.request.url.includes("/_next/"))
            scriptSourcesDuringLoad.push(params.request.url);
          if (isRSCResource(params.request.url)) {
            initialRscUrlHits.push(params.request.url);
            const requestData = requestDataMap.get(params.requestId);
            if (requestData) requestData.isRSC = true;
          }
        }
      );

      client.on(
        "Network.responseReceived",
        (params: Protocol.Network.ResponseReceivedEvent) => {
          const requestData = requestDataMap.get(params.requestId);
          if (requestData) {
            requestData.statusCode = params.response.status;
            requestData.encodedDataLength = params.response.encodedDataLength;
            requestData.nextHopProtocol = params.response.protocol;

            requestData.responseHeaders = params.response.headers;

            const contentType = params.response.headers["content-type"];
            requestData.resourceType = getResourceType(
              params.response.url,
              contentType
            );

            if (
              isRSCResource(
                params.response.url,
                contentType,
                params.response.headers
              )
            ) {
              requestData.isRSC = true;
            } else {
              requestData.isRSC = false;
            }
          }
        }
      );

      client.on(
        "Network.loadingFinished",
        async (params: Protocol.Network.LoadingFinishedEvent) => {
          const { requestId, timestamp, encodedDataLength } = params;
          const requestData = requestDataMap.get(requestId);

          if (requestData) {
            requestData.endTime = timestamp;
            if (
              encodedDataLength &&
              encodedDataLength !== requestData.encodedDataLength
            ) {
              requestData.encodedDataLength = encodedDataLength;
            }

            const contentType = requestData.responseHeaders?.["content-type"];
            const finalResourceType = getResourceType(
              requestData.url,
              contentType
            );
            requestData.resourceType = finalResourceType;

            const finalIsRSC = isRSCResource(
              requestData.url,
              contentType,
              requestData.responseHeaders
            );
            requestData.isRSC = finalIsRSC;

            const headers = requestData.responseHeaders || {};

            const getNormalizedHeader = (name: string): string | undefined => {
              if (headers[name] !== undefined) return headers[name];
              const lowerName = name.toLowerCase();
              const headerKey = Object.keys(headers).find(
                (key) => key.toLowerCase() === lowerName
              );
              return headerKey ? headers[headerKey] : undefined;
            };

            const cacheControl = getNormalizedHeader("cache-control");
            const pragma = getNormalizedHeader("pragma");
            const expires = getNormalizedHeader("expires");
            const etag = getNormalizedHeader("etag");
            const lastModified = getNormalizedHeader("last-modified");
            const age = getNormalizedHeader("age");
            const xVercelCache = getNormalizedHeader("x-vercel-cache");
            const cfCacheStatus = getNormalizedHeader("cf-cache-status");
            const xNextjsPrerender = getNormalizedHeader("x-nextjs-prerender");
            const xNextjsStaleTime = getNormalizedHeader("x-nextjs-stale-time");

            const predictedBehavior = predictResourceCacheBehavior(
              requestData.url,
              headers
            );

            if (
              finalIsRSC &&
              requestData.statusCode &&
              requestData.statusCode >= 200 &&
              requestData.statusCode < 300
            ) {
              try {
                const responseBody = await client!.send(
                  "Network.getResponseBody",
                  { requestId }
                );
                if (responseBody.body) {
                  const bodyDecoded = responseBody.base64Encoded
                    ? Buffer.from(responseBody.body, "base64").toString()
                    : responseBody.body;

                  rscPayloadContents.push(bodyDecoded);
                  requestData.decodedBodySize = Buffer.byteLength(
                    bodyDecoded,
                    "utf8"
                  );
                }
              } catch (e) {
                logger.warn(
                  `Failed to get response body for ${requestData.url}: ${
                    normalizeAppError(e).message
                  }`
                );
              }
            }

            const networkResource: NetworkResourceTiming = {
              requestId,
              url: requestData.url,
              method: requestData.method,
              resourceType: requestData.resourceType,
              statusCode: requestData.statusCode,
              startTime: requestData.startTime,
              endTime: requestData.endTime,
              duration: requestData.endTime
                ? (requestData.endTime - requestData.startTime) * 1000
                : undefined,
              decodedBodySize: requestData.decodedBodySize,
              encodedDataLength: requestData.encodedDataLength,
              nextHopProtocol: requestData.nextHopProtocol,
              isRSC: requestData.isRSC,
              requestHeaders: requestData.requestHeaders,
              responseHeaders: requestData.responseHeaders,
              // Standard cache headers
              cacheControl,
              expires,
              pragma,
              etag,
              lastModified,
              // CDN-specific cache indicators
              age,
              vercelCache: xVercelCache,
              cfCacheStatus,
              // Next.js specific
              nextjsPrerender: xNextjsPrerender,
              nextjsStaleTime: xNextjsStaleTime,
              predictedCacheBehavior: predictedBehavior,
            };

            networkResources.push(networkResource);

            const isChunk = isJSChunk(
              requestData.url,
              requestData.resourceType
            );

            if (isChunk) {
              jsChunks.push({
                url: requestData.url,
                size: requestData.encodedDataLength || 0,
                loadTime: networkResource.duration || 0,
              });
            }
            requestDataMap.delete(requestId);
          }
        }
      );

      logger.debug(`Navigating to ${normalizedUrl}...`);
      await page.goto(normalizedUrl, {
        waitUntil: "networkidle0",
        timeout: NAVIGATION_TIMEOUT,
      });
      logger.debug("Navigation complete.");

      result.isReachable = true;
      result.details.push("URL is reachable");

      const pageContent = await page.content();
      const isNextJsDetected = await this.detectNextJs(
        page,
        scriptSourcesDuringLoad,
        pageContent
      );
      result.isNextJs = isNextJsDetected;

      if (isNextJsDetected) {
        result.details.push("Detected Next.js application");
        const hasRSCDetected = await this.detectRSC(
          page,
          initialRscUrlHits,
          pageContent,
          networkResources
        );
        result.hasRSC = hasRSCDetected;

        if (hasRSCDetected) {
          result.details.push("Detected React Server Components");
          try {
            const analysisResultFromParser: RSCAnalysisResult =
              await rscParser.analyzeRSC(
                normalizedUrl,
                page,
                networkResources,
                jsChunks,
                rscPayloadContents,
                forceFresh
              );
            result.analysis = analysisResultFromParser;
            logger.debug("Detailed analysis processing complete.");
            if (analysisResultFromParser.rscPayloads.length > 0)
              result.details.push(
                `Processed ${analysisResultFromParser.rscPayloads.length} RSC components`
              );
            if (analysisResultFromParser.jsChunks.length > 0)
              result.details.push(
                `Tracked ${analysisResultFromParser.jsChunks.length} JavaScript chunks`
              );
            if (analysisResultFromParser.metrics.fcp)
              result.details.push(
                `First Contentful Paint: ${analysisResultFromParser.metrics.fcp.toFixed(
                  1
                )}ms`
              );
          } catch (analysisError) {
            logger.error(
              "Error during detailed RSC analysis processing",
              analysisError
            );
            result.details.push(
              `RSC detected but detailed analysis failed: ${
                normalizeAppError(analysisError).message
              }`
            );
          }
        } else {
          result.details.push(
            "Next.js detected but no definitive RSC indicators found"
          );
        }
      } else {
        result.details.push("Not a Next.js application");
      }

      logger.debug("Page analysis result", result);
      return result;
    } catch (error) {
      logger.error("Error analyzing URL", error);
      result.isReachable = false;
      result.details.push(`Error: ${normalizeAppError(error).message}`);
      return result;
    } finally {
      if (page) {
        await page.close();
        logger.debug("Puppeteer page closed.");
      }
    }
  }

  private async detectNextJs(
    page: Page,
    scriptSources: string[],
    pageContent: string
  ): Promise<boolean> {
    if (scriptSources.some((src) => src.includes("/_next/static/"))) {
      logger.debug("Next.js script pattern detected in network requests.");
      return true;
    }
    if (
      await page.evaluate(
        () =>
          !!document.querySelector(
            "[data-next-page], #__next, #__next_css__DO_NOT_USE__"
          )
      )
    ) {
      logger.debug("Next.js DOM element detected.");
      return true;
    }
    if (
      pageContent.includes("__NEXT_DATA__") ||
      pageContent.includes("self.__next_f") ||
      pageContent.includes("next-route-announcer")
    ) {
      logger.debug("Next.js content marker detected.");
      return true;
    }
    if (
      await page.evaluate(
        () => typeof (window as any).__NEXT_DATA__ !== "undefined"
      )
    ) {
      logger.debug("window.__NEXT_DATA__ detected.");
      return true;
    }
    logger.debug("No definitive Next.js indicators found.");
    return false;
  }

  private async detectRSC(
    page: Page,
    rscUrlHits: string[],
    pageContent: string,
    networkRes: NetworkResourceTiming[]
  ): Promise<boolean> {
    if (rscUrlHits.length > 0) {
      logger.debug(
        "RSC network request pattern (/_rsc or ?_rsc=) detected during load."
      );
      return true;
    }
    if (networkRes.some((res) => res.isRSC)) {
      logger.debug("RSC content type detected in network resources (CDP).");
      return true;
    }
    if (
      pageContent.includes("self.__next_f.push") ||
      pageContent.match(/"\$L\d+":/) ||
      pageContent.match(/"id":"\d+","chunks":/) ||
      pageContent.includes("text/x-component")
    ) {
      logger.debug("RSC content format marker detected in page source.");
      return true;
    }
    if (
      await page.evaluate(
        () =>
          typeof (window as any).__next_f !== "undefined" ||
          typeof (window as any).__RSC_MANIFEST !== "undefined"
      )
    ) {
      logger.debug("RSC window object (__next_f or __RSC_MANIFEST) detected.");
      return true;
    }
    logger.debug(
      "No definitive RSC indicators found post-load (Network, DOM, Window)."
    );
    return false;
  }

  private normalizeUrl(url: string): string {
    if (!url) return "";
    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    return url;
  }
}

export const pageAnalyzer = new PageAnalyzerService();
