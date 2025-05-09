/**
 * Determines the resource type, prioritizing Content-Type and falling back to URL patterns.
 * @param url The URL of the resource.
 * @param contentType Optional Content-Type header string.
 * @returns A string representing the resource type (e.g., 'script', 'stylesheet', 'rsc').
 */
export function getResourceType(url: string, contentType?: string): string {
  if (contentType) {
    const lowerContentType = contentType.toLowerCase();
    if (lowerContentType.startsWith("text/css")) return "stylesheet";
    if (
      lowerContentType.startsWith("application/javascript") ||
      lowerContentType.startsWith("text/javascript")
    )
      return "script";
    if (lowerContentType.startsWith("text/html")) return "document";
    if (lowerContentType.startsWith("image/")) return "image";
    if (lowerContentType.startsWith("font/")) return "font";
    if (lowerContentType.startsWith("text/x-component")) return "rsc";
    if (
      lowerContentType.startsWith("application/json") &&
      (url.includes("/_next/data/") || url.includes("/_rsc"))
    )
      return "rsc";
  }

  // Fallback to URL-based detection
  const extensionMatch = url.match(/\.([^.?#]+)(?:[?#]|$)/);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : "";

  if (url.includes("/_next/static/chunks/") || extension === "js")
    return "script";
  if (url.includes("/_next/static/css/") || extension === "css")
    return "stylesheet";
  if (url.includes("/_rsc") || url.includes("?_rsc=")) return "rsc";
  if (extension === "html" || url.endsWith("/")) return "document";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "ico"].includes(extension))
    return "image";
  if (["woff", "woff2", "ttf", "otf", "eot"].includes(extension)) return "font";
  return "other";
}

/**
 * Checks if a resource is likely an RSC payload, prioritizing Content-Type, then URL, then specific headers.
 * @param url The URL of the resource.
 * @param contentType Optional Content-Type header string.
 * @param responseHeaders Optional map of response headers.
 * @returns True if the resource is likely an RSC payload, false otherwise.
 */
export function isRSCResource(
  url: string,
  contentType?: string,
  responseHeaders?: Record<string, string>
): boolean {
  if (contentType) {
    const lowerContentType = contentType.toLowerCase();
    if (lowerContentType.includes("text/x-component")) return true;
    if (
      lowerContentType.includes("application/json") &&
      (url.includes("/_next/data/") || url.includes("/_rsc"))
    )
      return true;
  }
  if (url.includes("/_rsc") || url.includes("?_rsc=")) return true;
  if (responseHeaders) {
    // Ensure header names are checked case-insensitively if necessary, though HTTP/2+ are lowercase
    const lowerHeaders = Object.fromEntries(
      Object.entries(responseHeaders).map(([k, v]) => [k.toLowerCase(), v])
    );
    if (
      lowerHeaders["x-next-cache"] ||
      lowerHeaders["x-react-server-component"]
    )
      return true;
  }
  return false;
}

/**
 * Checks if a URL represents a JavaScript chunk, considering its resource type or URL pattern.
 * @param url The URL of the resource.
 * @param resourceType Optional already determined resource type.
 * @returns True if the resource is a JavaScript chunk, false otherwise.
 */
export function isJSChunk(url: string, resourceType?: string): boolean {
  if (resourceType === "script") return true;
  // More robust pattern for Next.js JS chunks, including runtime and webpack files
  const scriptUrlPattern =
    /\/_next\/static\/(chunks|runtime|webpack|pages|app)/;
  // Check common JS extensions as well
  if (url.endsWith(".js") || url.endsWith(".mjs") || scriptUrlPattern.test(url))
    return true;
  return false;
}

/**
 * Predicts a simplified cache behavior based on common HTTP response headers.
 * @param url The URL of the resource.
 * @param headers The response headers for the resource.
 * @returns A string indicating predicted cache behavior: 'cached', 'no-cache', 'validates', or 'unknown'.
 */
export function predictResourceCacheBehavior(
  url: string,
  headers: Record<string, string | undefined>
): "cached" | "no-cache" | "validates" | "unknown" {
  const normalizedHeaders: Record<string, string | undefined> = {};
  Object.keys(headers).forEach((key) => {
    normalizedHeaders[key.toLowerCase()] = headers[key];
  });

  const cacheControl = normalizedHeaders["cache-control"];
  const pragma = normalizedHeaders["pragma"];
  const expires = normalizedHeaders["expires"];
  const etag = normalizedHeaders["etag"];
  const lastModified = normalizedHeaders["last-modified"];
  const age = normalizedHeaders["age"];

  // CDN-specific cache indicators
  const vercelCache = normalizedHeaders["x-vercel-cache"];
  const cfCacheStatus = normalizedHeaders["cf-cache-status"];

  // Next.js specific headers
  const nextjsPrerender = normalizedHeaders["x-nextjs-prerender"];
  const nextjsStaleTime = normalizedHeaders["x-nextjs-stale-time"];

  // Direct cache hit indicators from CDNs
  if (vercelCache === "HIT" || cfCacheStatus === "HIT") {
    return "cached";
  }

  // If it's a Next.js asset with immutable and long max-age, it's definitely cached
  if (
    url.includes("/_next/static/") &&
    cacheControl &&
    cacheControl.includes("immutable") &&
    cacheControl.includes("max-age=31536000")
  ) {
    return "cached";
  }

  // Next.js static prerendered pages with stale-time
  if (nextjsPrerender === "1" && nextjsStaleTime) {
    if (cacheControl?.includes("must-revalidate")) {
      return "validates";
    }
  }

  // Check if resource has been in cache for some time via age header
  if (age && parseInt(age, 10) > 0) {
    // If it has age but requires validation
    if (cacheControl?.includes("must-revalidate")) {
      return "validates";
    }
    // Otherwise it's been cached and served directly
    return "cached";
  }

  if (cacheControl) {
    const directives = cacheControl
      .toLowerCase()
      .split(",")
      .map((d) => d.trim());

    // Strong no-cache indicators
    if (directives.includes("no-store")) {
      return "no-cache";
    }

    // no-cache directive still allows storage but requires validation
    if (directives.includes("no-cache")) {
      return "validates";
    }

    // Handle immutable directive (common in Next.js static assets)
    if (directives.includes("immutable")) {
      return "cached";
    }

    // Handle max-age directive
    if (directives.some((d) => d.startsWith("max-age="))) {
      const maxAgeDir = directives.find((d) => d.startsWith("max-age="));
      if (maxAgeDir) {
        const maxAge = parseInt(maxAgeDir.split("=")[1], 10);
        if (maxAge > 0) return "cached";
        if (maxAge === 0 && (etag || lastModified)) return "validates";
        if (maxAge === 0) return "no-cache";
      }
    }

    // Check for s-maxage in CDN contexts
    if (directives.some((d) => d.startsWith("s-maxage="))) {
      const sMaxAgeDir = directives.find((d) => d.startsWith("s-maxage="));
      if (sMaxAgeDir) {
        const sMaxAge = parseInt(sMaxAgeDir.split("=")[1], 10);
        if (sMaxAge > 0) return "cached";
      }
    }
  }

  if (pragma && pragma.toLowerCase().includes("no-cache")) {
    return "validates";
  }

  if (expires) {
    try {
      const expiresDate = new Date(expires);
      if (expiresDate.getTime() > Date.now()) {
        return "cached";
      }
      // If expires is in the past, it might mean revalidate or don't cache
      if (etag || lastModified) return "validates";
      return "no-cache";
    } catch (e) {
      // Invalid expires date format
    }
  }

  // If ETag or Last-Modified are present without other directives, it suggests validation
  if (etag || lastModified) {
    return "validates";
  }

  return "unknown";
}
