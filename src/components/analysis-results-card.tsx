"use client";

import * as React from "react";
import type { RSCValidationResult } from "@/services/rsc-detector";
import { motion, AnimatePresence } from "motion/react";
import { Info, CheckCircle, XCircle } from "lucide-react";

interface AnalysisResultsCardProps {
  result: RSCValidationResult;
}

export function AnalysisResultsCard({ result }: AnalysisResultsCardProps) {
  if (!result) return null;

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
        {result.details.length > 0 && (
          <li className="mt-4 pt-4 border-t border-subtle">
            <p className="font-medium text-foreground-secondary mb-2">
              Details:
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
