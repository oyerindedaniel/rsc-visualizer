import { Page } from "puppeteer";
import logger from "@/utils/logger";
import { normalizeAppError } from "@/utils/errors";
import type {
  NetworkResourceTiming,
  PerformanceMetrics,
  RSCPayloadPart,
  RSCAnalysisResult,
} from "@/types/analysis";

/**
 * Service responsible for parsing pre-collected RSC payloads and analyzing post-load performance data
 */
export class RSCParserService {
  /**
   * Analyzes pre-collected data and the loaded page state.
   *
   * @param url The analyzed URL
   * @param page The Puppeteer page object (after navigation)
   * @param networkResources Pre-collected network resource timings
   * @param jsChunks Pre-collected JS chunk information
   * @param rscPayloadContents Pre-collected raw RSC payload strings
   * @param forceFresh Whether to ignore cached data and force a fresh analysis
   * @returns Promise resolving to the analysis result
   */
  public async analyzeRSC(
    url: string,
    page: Page,
    networkResources: NetworkResourceTiming[],
    jsChunks: { url: string; size: number; loadTime: number }[],
    rscPayloadContents: string[],
    forceFresh = false
  ): Promise<RSCAnalysisResult> {
    logger.debug(
      `Starting RSC analysis processing for: ${url} (forceFresh: ${forceFresh})`
    );

    const uniqueJsChunks = this.processJsChunks(url, jsChunks);
    logger.debug(`Processed JS chunks: ${uniqueJsChunks.length} chunks`);

    const metrics = await this.collectPerformanceMetrics(page);

    const rscPayloads: RSCPayloadPart[] = [];
    logger.debug("RSC Payload parsing skipped as requested.");

    return {
      url,
      metrics,
      networkTimeline: networkResources,
      rscPayloads,
      jsChunks: uniqueJsChunks,
    };
  }

  /**
   * Processes JS chunks, handling caching and deduplication
   */
  private processJsChunks(
    pageUrl: string,
    jsChunks: { url: string; size: number; loadTime: number }[]
  ): { url: string; size: number; loadTime: number }[] {
    if (jsChunks.length > 0) {
      return jsChunks;
    }

    logger.debug(`No JS chunks to process for ${pageUrl}`);
    return [];
  }

  /**
   * Collects performance metrics from the page (after load)
   */
  private async collectPerformanceMetrics(
    page: Page
  ): Promise<PerformanceMetrics> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const performanceMetrics = await page.evaluate(() => {
        const metrics: Partial<PerformanceMetrics> = {};

        const navigation = performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          metrics.ttfb = navigation.responseStart - navigation.requestStart;
        }

        const paintEntries = performance.getEntriesByType("paint");
        const fcpEntry = paintEntries.find(
          (entry) => entry.name === "first-contentful-paint"
        );
        if (fcpEntry) {
          metrics.fcp = fcpEntry.startTime;
        }

        if ("PerformanceObserver" in window) {
          const lcpEntries = performance.getEntriesByType(
            "largest-contentful-paint"
          );
          if (lcpEntries.length > 0) {
            metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;
          }
        }

        return metrics as PerformanceMetrics;
      });

      logger.debug("[NodeJS] Final standard performance metrics collected", {
        performanceMetrics,
      });
      return performanceMetrics;
    } catch (error) {
      logger.error(
        `Error collecting standard performance metrics: ${
          normalizeAppError(error).message
        }`,
        { error }
      );
      return {} as PerformanceMetrics;
    }
  }

  /**
   * Extracts RSC payloads primarily from pre-collected content,
   * falling back to DOM/window checks.
   */
  private async extractAndParseRSCPayloads(
    page: Page,
    payloadContents: string[]
  ): Promise<RSCPayloadPart[]> {
    logger.debug("Skipping RSC payload extraction and parsing as requested.");
    return [];
  }
}

export const rscParser = new RSCParserService();
