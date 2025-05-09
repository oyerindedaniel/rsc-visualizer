/**
 * Formats a byte size into a human-readable string
 *
 * @param bytes The number of bytes
 * @param decimals The number of decimal places to display
 * @returns Formatted string (e.g., "1.5 KB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Formats a number with commas as thousands separators
 *
 * @param num The number to format
 * @returns Formatted string with commas
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Formats a time duration in milliseconds to a human-readable string
 *
 * @param ms Time in milliseconds
 * @returns Formatted time string
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(1)} ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)} s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
}
