import logger from "./logger";

const STORAGE_KEY_PREFIX = "rsc_visualizer_";

export const storage = {
  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (err) {
      logger.error("[Storage] Failed to save:", err);
    }
  },
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (err) {
      logger.error("[Storage] Failed to retrieve:", err);
      return null;
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + key);
    } catch (err) {
      logger.error("[Storage] Failed to remove:", err);
    }
  },
};

export const LAST_ANALYSIS_RESULT_KEY = "last_analysis_result";
