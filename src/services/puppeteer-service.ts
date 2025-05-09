import puppeteer, { Browser, Page } from "puppeteer";
import logger from "@/utils/logger";
import { NAVIGATION_TIMEOUT } from "@/config/app";

/**
 * Singleton service to manage Puppeteer browser instance
 * Provides methods to create and manage browser and page instances
 */
class PuppeteerService {
  private browser: Browser | null = null;
  private isInitializing = false;
  private initPromise: Promise<Browser> | null = null;

  /**
   * Initialize a Puppeteer browser instance if one doesn't exist
   * Uses a promise to prevent multiple simultaneous initializations
   * @returns Promise that resolves to a Browser instance
   */
  public async getBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;

    logger.debug("Initializing Puppeteer browser");

    this.initPromise = puppeteer.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
      ],
    });

    try {
      this.browser = await this.initPromise;
      logger.debug("Puppeteer browser initialized successfully");
      return this.browser;
    } catch (error) {
      logger.error("Failed to initialize Puppeteer browser", error);
      throw error;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  /**
   * Create a new page in the browser
   * @returns Promise that resolves to a Page instance
   */
  public async newPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

    return page;
  }

  /**
   * Close the browser instance if it exists
   */
  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      logger.debug("Closing Puppeteer browser");
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default PuppeteerService;
