import { Page } from "puppeteer";
import logger from "@/utils/logger";
import { puppeteerService } from "./puppeteer-service";
import { NAVIGATION_TIMEOUT } from "@/app/config/app";
import { normalizeAppError } from "@/utils/errors";

export interface RSCValidationResult {
  /** Whether the URL is valid and reachable */
  isReachable: boolean;
  /** Whether the site is a Next.js application */
  isNextJs: boolean;
  /** Whether the site uses React Server Components */
  hasRSC: boolean;
  /** Additional details or reasons for the determination */
  details: string[];
  /** Raw data captured during analysis (useful for debugging) */
  rawData?: {
    scriptSources?: string[];
    rscPayloads?: string[];
    nextData?: any;
  };
}

/**
 * RSC Detector Service provides methods to detect React Server Components in Next.js applications
 */
export class RSCDetectorService {
  /**
   * Validates if a given URL is using Next.js with React Server Components (RSC)
   *
   * @param url The URL to analyze
   * @returns Promise resolving to a validation result
   */
  public async validateUrl(url: string): Promise<RSCValidationResult> {
    logger.debug(`Validating URL for RSC: ${url}`);

    const normalizedUrl = this.normalizeUrl(url);
    logger.debug(`Normalized URL: ${normalizedUrl}`);

    const result: RSCValidationResult = {
      isReachable: false,
      isNextJs: false,
      hasRSC: false,
      details: [],
    };

    let page;
    try {
      page = await puppeteerService.newPage();

      await page.setRequestInterception(true);

      const scriptSources: string[] = [];
      const rscPayloads: string[] = [];

      page.on("request", (request) => {
        const url = request.url();

        logger.debug(`Detected Next.js resource: ${url}`);

        // Checks for next.js resource URLs
        if (url.includes("/_next/")) {
          logger.debug(`Detected Next.js resource: ${url}`);
        }

        // Checks for RSC-specific request patterns
        if (url.includes("/_rsc") || url.includes("?_rsc=")) {
          logger.debug(`Detected RSC request: ${url}`);
          rscPayloads.push(url);
        }

        request.continue();
      });

      page.on("response", async (response) => {
        const url = response.url();
        const contentType = response.headers()["content-type"] || "";

        if (
          contentType.includes("javascript") &&
          url.includes("/_next/static/")
        ) {
          scriptSources.push(url);
        }
      });

      logger.debug(`Navigating to ${normalizedUrl}`);
      await page.goto(normalizedUrl, {
        waitUntil: "networkidle2",
        timeout: NAVIGATION_TIMEOUT,
      });

      result.isReachable = true;
      result.details.push("URL is reachable");

      const pageContent = await page.content();

      result.rawData = {
        scriptSources,
        rscPayloads,
      };

      const isNextJs = await this.detectNextJs(
        page,
        scriptSources,
        pageContent
      );
      result.isNextJs = isNextJs;

      if (isNextJs) {
        result.details.push("Detected Next.js application");

        const hasRSC = await this.detectRSC(page, rscPayloads, pageContent);
        result.hasRSC = hasRSC;

        if (hasRSC) {
          result.details.push("Detected React Server Components");
        } else {
          result.details.push(
            "Next.js detected but no React Server Components found"
          );
        }
      } else {
        result.details.push("Not a Next.js application");
      }

      logger.debug("RSC validation result", result);
      return result;
    } catch (error) {
      logger.error("Error validating URL for RSC", error);

      result.details.push(`Error: ${normalizeAppError(error).message}`);
      return result;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Detects if the page is using Next.js
   *
   * @param page Puppeteer Page instance
   * @param scriptSources Array of script sources
   * @param pageContent HTML content of the page
   * @returns Boolean indicating if Next.js was detected
   */
  private async detectNextJs(
    page: Page,
    scriptSources: string[],
    pageContent: string
  ): Promise<boolean> {
    // Checks for Next.js script signatures
    const hasNextScripts = scriptSources.some(
      (src) =>
        src.includes("/_next/static/chunks/") ||
        src.includes("/_next/static/runtime/")
    );

    // Checks for Next.js data attributes or structure
    const hasNextDataElements = await page.evaluate(() => {
      return (
        !!document.querySelector("[data-next-page]") ||
        !!document.querySelector("#__next") ||
        !!document.querySelector("#__next_css__DO_NOT_USE__")
      );
    });

    // Checks for Next.js self references in content
    const hasNextContentMarkers =
      pageContent.includes("__NEXT_DATA__") ||
      pageContent.includes("__next_f") ||
      pageContent.includes("next-route-announcer");

    // Checks for Next.js config in window object
    const hasNextConfig = await page.evaluate(() => {
      return typeof (window as any).__NEXT_DATA__ !== "undefined";
    });

    if (hasNextScripts) logger.debug("Detected Next.js scripts");
    if (hasNextDataElements) logger.debug("Detected Next.js DOM elements");
    if (hasNextContentMarkers) logger.debug("Detected Next.js content markers");
    if (hasNextConfig) logger.debug("Detected Next.js config");

    return (
      hasNextScripts ||
      hasNextDataElements ||
      hasNextContentMarkers ||
      hasNextConfig
    );
  }

  /**
   * Detects if the Next.js application is using React Server Components
   *
   * @param page Puppeteer Page instance
   * @param rscPayloads Array of detected RSC payloads
   * @param pageContent HTML content of the page
   * @returns Boolean indicating if RSC was detected
   */
  private async detectRSC(
    page: Page,
    rscPayloads: string[],
    pageContent: string
  ): Promise<boolean> {
    // Checks for direct RSC network requests
    const hasRscRequests = rscPayloads.length > 0;

    // Checks for RSC payload format in content
    const hasRscContentFormat =
      pageContent.includes("self.__next_f.push") ||
      pageContent.includes('"rsc"') ||
      pageContent.includes("useId:") ||
      pageContent.includes("suspense:");

    // Checks for App Router directory structure references (common in RSC Next.js)
    const hasAppRouterReferences = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      return scripts.some((script) => {
        const src = script.getAttribute("src") || "";
        return (
          src.includes("/app/") ||
          src.includes("app/layout") ||
          src.includes("app/page")
        );
      });
    });

    // Checks for advanced RSC payload structure
    const hasRscPayloadStructure = await page.evaluate(() => {
      return (
        typeof (window as any).__next_f !== "undefined" ||
        typeof (window as any).__RSC_MANIFEST !== "undefined"
      );
    });

    if (hasRscRequests) logger.debug("Detected RSC requests");
    if (hasRscContentFormat) logger.debug("Detected RSC content format");
    if (hasAppRouterReferences) logger.debug("Detected App Router references");
    if (hasRscPayloadStructure) logger.debug("Detected RSC payload structure");

    return (
      hasRscRequests ||
      hasRscContentFormat ||
      hasAppRouterReferences ||
      hasRscPayloadStructure
    );
  }

  /**
   * Normalizes a URL by adding protocol if missing
   *
   * @param url URL to normalize
   * @returns Normalized URL
   */
  private normalizeUrl(url: string): string {
    if (!url) return "";

    url = url.trim();

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    return url;
  }
}

export const rscDetector = new RSCDetectorService();
