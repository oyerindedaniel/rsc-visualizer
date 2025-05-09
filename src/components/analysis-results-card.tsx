"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Code,
  Package,
  BarChart3,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { formatBytes } from "@/utils/format";
import Link from "next/link";
import { useResourceContext } from "@/contexts/resource-context";

export function AnalysisResultsCard() {
  const { result } = useResourceContext();
  const [showComponentTree, setShowComponentTree] = React.useState(false);
  const [showJsChunks, setShowJsChunks] = React.useState(false);

  if (!result) return null;

  const hasAnalysisData = result.hasRSC && result.analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="w-full p-5 border border-subtle rounded-xl bg-surface-secondary/50 shadow-md"
    >
      <h2 className="text-lg font-semibold mb-4 text-foreground-primary flex items-center tracking-[-0.03em]">
        <Info className="w-5 h-5 mr-2 text-primary" />
        Analysis Results
      </h2>
      <ul className="space-y-3 text-sm">
        <li className="flex items-center justify-between">
          <span className="text-foreground-secondary">URL Reachable</span>
          <span className="flex items-center gap-1.5">
            {result.isReachable ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-error" />
            )}
            {result.isReachable ? "Yes" : "No"}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-foreground-secondary">Next.js Detected</span>
          <span className="flex items-center gap-1.5">
            {result.isNextJs ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-error" />
            )}
            {result.isNextJs ? "Yes" : "No"}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-foreground-secondary">
            React Server Components
          </span>
          <span className="flex items-center gap-1.5">
            {result.hasRSC ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-error" />
            )}
            {result.hasRSC ? "Yes" : "No"}
          </span>
        </li>

        {hasAnalysisData && (
          <>
            <li className="pt-3 mt-3 border-t border-subtle">
              <h3 className="font-medium text-foreground-default mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-primary" />
                Performance Metrics
              </h3>
              <ul className="grid grid-cols-2 gap-2 mt-3">
                {result.analysis?.metrics.ttfb !== undefined && (
                  <li className="bg-surface-tertiary/50 px-3 py-2 rounded-md">
                    <div className="text-xs text-foreground-muted">TTFB</div>
                    <div className="font-mono text-foreground-default">
                      {result.analysis.metrics.ttfb.toFixed(2)} ms
                    </div>
                  </li>
                )}

                {result.analysis?.metrics.fcp !== undefined && (
                  <li className="bg-surface-tertiary/50 px-3 py-2 rounded-md">
                    <div className="text-xs text-foreground-muted">
                      First Contentful Paint
                    </div>
                    <div className="font-mono text-foreground-default">
                      {result.analysis.metrics.fcp.toFixed(2)} ms
                    </div>
                  </li>
                )}

                {result.analysis?.metrics.lcp !== undefined && (
                  <li className="bg-surface-tertiary/50 px-3 py-2 rounded-md">
                    <div className="text-xs text-foreground-muted">
                      Largest Contentful Paint
                    </div>
                    <div className="font-mono text-foreground-default">
                      {result.analysis.metrics.lcp.toFixed(2)} ms
                    </div>
                  </li>
                )}

                {result.analysis?.metrics.tti !== undefined && (
                  <li className="bg-surface-tertiary/50 px-3 py-2 rounded-md">
                    <div className="text-xs text-foreground-muted">
                      Time to Interactive
                    </div>
                    <div className="font-mono text-foreground-default">
                      {result.analysis.metrics.tti.toFixed(2)} ms
                    </div>
                  </li>
                )}

                {result.analysis?.metrics.hydrationStart !== undefined && (
                  <li className="bg-surface-tertiary/50 px-3 py-2 rounded-md">
                    <div className="text-xs text-foreground-muted">
                      Hydration Start
                    </div>
                    <div className="font-mono text-foreground-default">
                      {result.analysis.metrics.hydrationStart.toFixed(2)} ms
                    </div>
                  </li>
                )}

                {result.analysis?.metrics.hydrationEnd !== undefined && (
                  <li className="bg-surface-tertiary/50 px-3 py-2 rounded-md">
                    <div className="text-xs text-foreground-muted">
                      Hydration End
                    </div>
                    <div className="font-mono text-foreground-default">
                      {result.analysis.metrics.hydrationEnd.toFixed(2)} ms
                    </div>
                  </li>
                )}
              </ul>
            </li>

            <li className="pt-3 mt-3 border-t border-subtle">
              <button
                onClick={() => setShowComponentTree((prev) => !prev)}
                className="w-full font-medium text-foreground-default mb-2 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center">
                  <Code className="w-4 h-4 mr-1.5 text-primary" />
                  RSC Component Tree
                  <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {result.analysis?.rscPayloads.length || 0} Components
                  </span>
                </span>
                {showComponentTree ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {showComponentTree && result.analysis?.rscPayloads.length && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 max-h-80 overflow-y-auto border border-subtle rounded bg-surface-tertiary/30 p-3">
                      {result.analysis.rscPayloads.map((component, index) => (
                        <ComponentTreeItem
                          key={index}
                          component={component}
                          level={0}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>

            <li className="pt-3 mt-3 border-t border-subtle">
              <button
                onClick={() => setShowJsChunks((prev) => !prev)}
                className="w-full font-medium text-foreground-default mb-2 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center">
                  <Package className="w-4 h-4 mr-1.5 text-primary" />
                  JavaScript Chunks
                  <span className="ml-2 text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {result.analysis?.jsChunks.length || 0} Chunks
                  </span>
                </span>
                {showJsChunks ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {showJsChunks && result.analysis?.jsChunks.length && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 max-h-60 overflow-y-auto border border-subtle rounded bg-surface-tertiary/30">
                      <table className="w-full text-xs">
                        <thead className="bg-surface-tertiary/50">
                          <tr>
                            <th className="py-2 px-3 text-left font-medium text-foreground-subtle">
                              File
                            </th>
                            <th className="py-2 px-3 text-left font-medium text-foreground-subtle">
                              Size
                            </th>
                            <th className="py-2 px-3 text-left font-medium text-foreground-subtle">
                              Load Time
                            </th>
                            <th className="py-2 px-3 text-left font-medium text-foreground-subtle">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.analysis.jsChunks.map((chunk, index) => (
                            <tr
                              key={index}
                              className="border-t border-subtle hover:bg-surface-hover/50"
                            >
                              <td className="py-1.5 px-3 font-mono truncate max-w-[200px] sm:max-w-[280px]">
                                {chunk.url.split("/").pop()}
                              </td>
                              <td className="py-1.5 px-3 font-mono">
                                {formatBytes(chunk.size)}
                              </td>
                              <td className="py-1.5 px-3 font-mono">
                                {chunk.loadTime.toFixed(2)} ms
                              </td>
                              <td className="py-1.5 px-3">
                                <Link
                                  href={`/js-chunks/${encodeURIComponent(
                                    chunk.url
                                  )}`}
                                  className="text-primary hover:underline text-xs flex items-center cursor-pointer"
                                  aria-label={`View details for ${chunk.url
                                    .split("/")
                                    .pop()}`}
                                >
                                  View
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          </>
        )}

        {result.details.length > 0 && (
          <li className="mt-4 pt-4 border-t border-subtle">
            <p className="font-medium text-foreground-secondary mb-2 flex items-center">
              <BarChart3 className="w-4 h-4 mr-1.5 text-primary" />
              Details
            </p>
            <ul className="list-disc list-inside text-foreground-muted space-y-1.5 text-xs">
              {result.details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </motion.div>
  );
}

interface ComponentTreeItemProps {
  component: {
    id: string;
    type: string;
    isServerComponent: boolean;
    props?: Record<string, any>;
    children?: any[];
    payloadSize?: number;
  };
  level: number;
}

function ComponentTreeItem({ component, level }: ComponentTreeItemProps) {
  const [expanded, setExpanded] = React.useState(level < 2);
  const hasChildren = component.children && component.children.length > 0;

  return (
    <div className="font-mono text-xs">
      <div
        className={`flex items-center py-1 ${
          level > 0 ? "pl-" + level * 4 : ""
        }`}
        style={{ paddingLeft: level * 12 }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="mr-1 p-0.5 hover:bg-surface-hover rounded cursor-pointer"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-foreground-muted" />
            ) : (
              <ChevronRight className="w-3 h-3 text-foreground-muted" />
            )}
          </button>
        )}

        <span
          className={`px-1 rounded ${
            component.isServerComponent
              ? "text-node-server"
              : "text-node-client"
          }`}
        >
          {component.type}
        </span>

        {component.payloadSize && (
          <span className="ml-2 text-[10px] text-foreground-muted">
            ({formatBytes(component.payloadSize)})
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {component.children?.map((child, index) => (
            <ComponentTreeItem
              key={index}
              component={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
