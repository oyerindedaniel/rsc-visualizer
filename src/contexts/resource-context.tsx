"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type {
  NetworkResourceTiming,
  PageAnalysisResult,
} from "@/types/analysis";
import { LAST_ANALYSIS_RESULT_KEY, storage } from "@/utils/storage-utils";
import logger from "@/utils/logger";

export type ResourceDetail = Pick<
  NetworkResourceTiming,
  | "url"
  | "resourceType"
  | "statusCode"
  | "duration"
  | "encodedDataLength"
  | "predictedCacheBehavior"
  | "cacheControl"
  | "expires"
  | "pragma"
  | "etag"
  | "lastModified"
  | "age"
  | "vercelCache"
  | "cfCacheStatus"
  | "nextjsPrerender"
  | "nextjsStaleTime"
> & {
  id: string;
  size?: number; // alias for encodedDataLength
  loadTime?: number; // alias for duration
};

interface ResourceContextType {
  result: PageAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  forceFresh: boolean;
  resourceDetails: Record<string, ResourceDetail>;

  setForceFresh: (value: boolean) => void;
  runAnalysis: (url: string) => Promise<void>;
  clearAnalysis: () => void;
  setResourceFromNetworkTimeline: (
    networkTimeline: NetworkResourceTiming[]
  ) => void;
  clearResources: () => void;
}

const ResourceContext = createContext<ResourceContextType | undefined>(
  undefined
);

export function ResourceProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<PageAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceFresh, setForceFresh] = useState(false);

  const [resourceDetails, setResourceDetails] = useState<
    Record<string, ResourceDetail>
  >({});

  React.useEffect(() => {
    const savedResult = storage.getItem(LAST_ANALYSIS_RESULT_KEY);
    if (savedResult) {
      setResult(savedResult);

      if (savedResult.analysis?.networkTimeline) {
        setResourceFromNetworkTimeline(savedResult.analysis.networkTimeline);
      }
    }
  }, []);

  const setResourceFromNetworkTimeline = (
    networkTimeline: NetworkResourceTiming[]
  ) => {
    const detailsMap: Record<string, ResourceDetail> = {};

    networkTimeline.forEach((resource) => {
      if (resource.url) {
        const encodedUrl = encodeURIComponent(resource.url);
        detailsMap[encodedUrl] = {
          id: encodedUrl,
          url: resource.url,
          size: resource.encodedDataLength,
          loadTime: resource.duration,
          resourceType: resource.resourceType,
          statusCode: resource.statusCode,
          duration: resource.duration,
          encodedDataLength: resource.encodedDataLength,
          predictedCacheBehavior: resource.predictedCacheBehavior,
          cacheControl: resource.cacheControl,
          expires: resource.expires,
          pragma: resource.pragma,
          etag: resource.etag,
          lastModified: resource.lastModified,
          age: resource.age,
          vercelCache: resource.vercelCache,
          cfCacheStatus: resource.cfCacheStatus,
          nextjsPrerender: resource.nextjsPrerender,
          nextjsStaleTime: resource.nextjsStaleTime,
        };
      }
    });

    setResourceDetails(detailsMap);
  };

  const runAnalysis = async (url: string) => {
    if (!url) {
      setError("Please enter a URL");
      setResult(null);
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Invalid URL format. Please include http:// or https://");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    if (forceFresh) {
      clearResources();
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          forceFresh,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.details?.url?.[0] || data.error || "Failed to analyze URL"
        );
        logger.error("API Error:", data);
      } else {
        const analysisResult = data as PageAnalysisResult;

        setResult(analysisResult);
        storage.setItem(LAST_ANALYSIS_RESULT_KEY, analysisResult);

        if (analysisResult.analysis?.networkTimeline) {
          setResourceFromNetworkTimeline(
            analysisResult.analysis.networkTimeline
          );
        }
      }
    } catch (err) {
      logger.error("Fetch Error:", err);
      setError("An unexpected error occurred. Check the console.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAnalysis = () => {
    setResult(null);
    setError(null);
    clearResources();
    storage.removeItem(LAST_ANALYSIS_RESULT_KEY);
  };

  const clearResources = () => {
    setResourceDetails({});
  };

  return (
    <ResourceContext.Provider
      value={{
        result,
        isLoading,
        error,
        forceFresh,
        resourceDetails,

        setForceFresh,
        runAnalysis,
        clearAnalysis,
        setResourceFromNetworkTimeline,
        clearResources,
      }}
    >
      {children}
    </ResourceContext.Provider>
  );
}

export function useResourceContext() {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error(
      "useResourceContext must be used within a ResourceProvider"
    );
  }
  return context;
}
