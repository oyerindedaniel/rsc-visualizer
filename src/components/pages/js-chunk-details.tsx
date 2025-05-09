"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResourceContext } from "@/contexts/resource-context";
import { formatBytes } from "@/utils/format";
import GridCross from "../grid-cross";

export default function JsChunkDetails() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "N/A";
  const decodedUrl =
    typeof params.id === "string" ? decodeURIComponent(params.id) : "N/A";

  const { resourceDetails } = useResourceContext();
  const chunkDetails = resourceDetails[id];

  return (
    <div className="relative min-h-screen grid-pattern-background flex flex-col items-center p-4 sm:p-8">
      <GridCross
        style={{
          left: `calc(3 * var(--grid-size) - (var(--cross-size) / 2))`,
          top: `calc(4 * var(--grid-size) - (var(--cross-size) / 2))`,
        }}
      />

      <AnimatePresence mode="wait">
        <motion.main
          key={id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: 0.4,
            type: "spring",
            stiffness: 100,
          }}
          className="relative z-10 w-full max-w-4xl bg-surface-secondary/50 shadow-md rounded-xl p-6 sm:p-10 flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground-default truncate shrink min-w-0">
              Resource Details
            </h1>
            <Button variant="outline" asChild>
              <Link href="/" aria-label="Back to results">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
          </div>

          {!chunkDetails && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-error"
            >
              Could not load resource details for: {decodedUrl}
            </motion.p>
          )}

          {chunkDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="space-y-6"
            >
              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-primary">
                  General Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="md:col-span-2">
                    <p className="font-medium text-foreground-muted">
                      Full URL:
                    </p>
                    <p
                      className="text-foreground-default break-all font-mono text-xs mt-1"
                      title={chunkDetails.url}
                    >
                      {chunkDetails.url}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground-muted">
                      Resource Type:
                    </p>
                    <p className="text-foreground-default capitalize mt-1">
                      {chunkDetails.resourceType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground-muted">
                      Status Code:
                    </p>
                    <p className="text-foreground-default mt-1">
                      {chunkDetails.statusCode || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground-muted">Size:</p>
                    <p className="text-foreground-default mt-1">
                      {chunkDetails.size
                        ? formatBytes(chunkDetails.size)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground-muted">
                      Load Time:
                    </p>
                    <p className="text-foreground-default mt-1">
                      {chunkDetails.loadTime
                        ? chunkDetails.loadTime.toFixed(0) + " ms"
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-semibold text-primary">
                  Caching Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground-muted">
                      Predicted Behavior:
                    </p>
                    {chunkDetails.predictedCacheBehavior && (
                      <Badge
                        variant={
                          chunkDetails.predictedCacheBehavior === "cached"
                            ? "cached"
                            : chunkDetails.predictedCacheBehavior ===
                              "validates"
                            ? "validates"
                            : chunkDetails.predictedCacheBehavior === "no-cache"
                            ? "noCache"
                            : "unknown"
                        }
                        className="mt-1 capitalize"
                      >
                        {chunkDetails.predictedCacheBehavior.replace("-", " ")}
                      </Badge>
                    )}
                    {!chunkDetails.predictedCacheBehavior && (
                      <p className="text-foreground-default mt-1">N/A</p>
                    )}
                  </div>

                  {/* CDN Cache Status */}
                  <div>
                    <p className="font-medium text-foreground-muted">
                      CDN Cache Status:
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      {chunkDetails.vercelCache && (
                        <span className="inline-flex items-center">
                          <Badge
                            variant={
                              chunkDetails.vercelCache === "HIT"
                                ? "cached"
                                : "noCache"
                            }
                            className="mr-2"
                          >
                            {chunkDetails.vercelCache}
                          </Badge>
                          <span className="text-xs text-foreground-subtle">
                            Vercel
                          </span>
                        </span>
                      )}
                      {chunkDetails.cfCacheStatus && (
                        <span className="inline-flex items-center">
                          <Badge
                            variant={
                              chunkDetails.cfCacheStatus === "HIT"
                                ? "cached"
                                : "noCache"
                            }
                            className="mr-2"
                          >
                            {chunkDetails.cfCacheStatus}
                          </Badge>
                          <span className="text-xs text-foreground-subtle">
                            Cloudflare
                          </span>
                        </span>
                      )}
                      {!chunkDetails.vercelCache &&
                        !chunkDetails.cfCacheStatus && (
                          <p className="text-foreground-default font-mono text-xs">
                            N/A
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Age (time in cache) */}
                  <div>
                    <p className="font-medium text-foreground-muted">
                      Age (time in cache):
                    </p>
                    <p className="text-foreground-default font-mono text-xs mt-1">
                      {chunkDetails.age ? `${chunkDetails.age} seconds` : "N/A"}
                    </p>
                  </div>

                  {/* Cache-Control */}
                  <div>
                    <p className="font-medium text-foreground-muted">
                      Cache-Control:
                    </p>
                    <p className="text-foreground-default font-mono text-xs mt-1 break-all">
                      {chunkDetails.cacheControl || "N/A"}
                    </p>
                  </div>

                  {/* ETag */}
                  <div>
                    <p className="font-medium text-foreground-muted">ETag:</p>
                    <p className="text-foreground-default font-mono text-xs mt-1 break-all">
                      {chunkDetails.etag || "N/A"}
                    </p>
                  </div>

                  {/* Expires */}
                  <div>
                    <p className="font-medium text-foreground-muted">
                      Expires:
                    </p>
                    <p className="text-foreground-default font-mono text-xs mt-1 break-all">
                      {chunkDetails.expires || "N/A"}
                    </p>
                  </div>

                  {/* Last-Modified */}
                  <div>
                    <p className="font-medium text-foreground-muted">
                      Last-Modified:
                    </p>
                    <p className="text-foreground-default font-mono text-xs mt-1 break-all">
                      {chunkDetails.lastModified || "N/A"}
                    </p>
                  </div>

                  {/* Pragma */}
                  <div>
                    <p className="font-medium text-foreground-muted">Pragma:</p>
                    <p className="text-foreground-default font-mono text-xs mt-1 break-all">
                      {chunkDetails.pragma || "N/A"}
                    </p>
                  </div>

                  {/* Next.js specific */}
                  {(chunkDetails.nextjsPrerender ||
                    chunkDetails.nextjsStaleTime) && (
                    <div className="md:col-span-2 border-t border-subtle pt-2 mt-1">
                      <p className="font-medium text-foreground-muted mb-2">
                        Next.js Specific Headers:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        {chunkDetails.nextjsPrerender && (
                          <div>
                            <p className="text-xs text-foreground-subtle">
                              x-nextjs-prerender:
                            </p>
                            <p className="text-foreground-default font-mono text-xs">
                              {chunkDetails.nextjsPrerender}
                            </p>
                          </div>
                        )}
                        {chunkDetails.nextjsStaleTime && (
                          <div>
                            <p className="text-xs text-foreground-subtle">
                              x-nextjs-stale-time:
                            </p>
                            <p className="text-foreground-default font-mono text-xs">
                              {chunkDetails.nextjsStaleTime}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}
        </motion.main>
      </AnimatePresence>

      <footer className="relative z-10 mt-auto pt-8 text-center text-foreground-muted text-xs">
        RSC Visualizer - Resource Analysis
      </footer>
    </div>
  );
}
