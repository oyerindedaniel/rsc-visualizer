export interface NetworkResourceTiming {
  requestId: string;
  url: string;
  method: string;
  resourceType: string;
  statusCode?: number;
  startTime: number; // CDP timestamp (s)
  endTime?: number; // CDP timestamp (s)
  duration?: number; // ms
  decodedBodySize?: number;
  encodedDataLength?: number;
  nextHopProtocol?: string;
  isRSC?: boolean;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  cacheControl?: string;
  expires?: string;
  pragma?: string;
  etag?: string;
  lastModified?: string;
  age?: string;
  vercelCache?: string;
  cfCacheStatus?: string;
  nextjsPrerender?: string;
  nextjsStaleTime?: string;
  predictedCacheBehavior?: "cached" | "no-cache" | "validates" | "unknown";
}

export interface PerformanceMetrics {
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  tti?: number;
  hydrationStart?: number;
  hydrationEnd?: number;
}

export interface RSCPayloadPart {
  id: string;
  type: string;
  isServerComponent: boolean;
  props?: Record<string, any>;
  children?: RSCPayloadPart[]; // Recursive, refers to itself
  payloadSize?: number;
}

export interface RSCAnalysisResult {
  url: string;
  metrics: PerformanceMetrics;
  networkTimeline: NetworkResourceTiming[];
  rscPayloads: RSCPayloadPart[];
  jsChunks: {
    url: string;
    size: number;
    loadTime: number;
  }[];
}

export interface PageAnalysisResult {
  isReachable: boolean;
  isNextJs: boolean;
  hasRSC: boolean;
  details: string[];
  analysis?: RSCAnalysisResult;
}
