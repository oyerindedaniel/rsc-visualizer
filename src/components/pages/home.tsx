"use client";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  SendHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import type { RSCValidationResult } from "@/services/rsc-detector";
import logger from "@/utils/logger";
import { motion, AnimatePresence } from "motion/react";

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RSCValidationResult | null>(null);

  const handleAnalyze = async () => {
    const url = inputRef.current?.value;
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

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.details?.url?.[0] || data.error || "Failed to analyze URL"
        );
        logger.error("API Error:", data);
      } else {
        setResult(data as RSCValidationResult);
      }
    } catch (err) {
      logger.error("Fetch Error:", err);
      setError("An unexpected error occurred. Check the console.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleAnalyze();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col items-center h-full gap-6 max-w-2xl mx-auto">
          <p className="text-foreground-muted text-center mt-20 shrink-0">
            Enter a Next.js URL below to begin analysis.
          </p>

          <AnimatePresence>
            {result && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full p-5 border border-subtle rounded-xl bg-surface-secondary/50 shadow-md"
              >
                <h2 className="text-lg font-semibold mb-4 text-foreground-primary flex items-center">
                  <Info className="w-5 h-5 mr-2 text-primary" />
                  Analysis Results
                </h2>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-foreground-secondary">
                      URL Reachable
                    </span>
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
                    <span className="text-foreground-secondary">
                      Next.js Detected
                    </span>
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
                        <XCircle className="w-4 h-4 text-muted" />
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
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-4 border-t border-subtle bg-surface-primary shrink-0">
        <div
          className={cn(
            "relative flex items-center gap-2 max-w-2xl mx-auto w-full p-1.5 rounded-3xl shadow-md overflow-hidden",
            "border border-subtle bg-surface-secondary",
            "transition-all duration-200 ease-in-out",
            "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface-primary",
            error &&
              "ring-2 ring-error ring-offset-2 ring-offset-surface-primary focus-within:ring-error"
          )}
        >
          <Input
            ref={inputRef}
            autoFocus
            type="url"
            placeholder="Enter Next.js App URL (e.g., https://nextjs.org)"
            className="flex-1 h-10 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-4 text-sm pr-2"
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-invalid={!!error}
            aria-describedby={error ? "error-message" : undefined}
          />
          <Button
            type="submit"
            variant="default"
            size="icon"
            className="w-9 h-9 shrink-0"
            aria-label="Analyze URL"
            onClick={handleAnalyze}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizontal className="w-4 h-4" />
            )}
          </Button>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              id="error-message"
              className="text-sm text-error mt-2 flex items-center justify-center mx-auto w-max"
            >
              <AlertCircle className="w-4 h-4 inline mr-1.5" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
