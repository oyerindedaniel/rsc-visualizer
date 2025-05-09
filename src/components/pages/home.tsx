"use client";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SendHorizontal, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AnalysisResultsCard } from "../analysis-results-card";
import { useResourceContext } from "@/contexts/resource-context";
import GridCross from "../grid-cross";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { result, isLoading, error, forceFresh, setForceFresh, runAnalysis } =
    useResourceContext();

  const handleAnalyze = async () => {
    const url = inputRef.current?.value;
    if (url) {
      runAnalysis(url);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleAnalyze();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow p-4 overflow-y-auto grid-pattern-background relative">
        <GridCross
          style={{
            left: `calc(3 * var(--grid-size) - (var(--cross-size) / 2))`,
            top: `calc(4 * var(--grid-size) - (var(--cross-size) / 2))`,
          }}
        />

        <div className="flex flex-col items-center h-full gap-6 max-w-2xl mx-auto relative z-10">
          <p className="text-foreground-muted text-center mt-20 shrink-0 tracking-[-0.03em]">
            Enter a Next.js URL below to begin analysis.
          </p>

          <AnimatePresence>
            {result && !isLoading && <AnalysisResultsCard />}
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={forceFresh ? "secondary" : "ghost"}
                size="icon"
                className="w-9 h-9 shrink-0"
                aria-label={
                  forceFresh
                    ? "Force fresh request"
                    : "Use cached request if available"
                }
                onClick={() => setForceFresh(!forceFresh)}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("w-4 h-4", forceFresh && "text-primary")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {forceFresh
                ? "Always fetch fresh data (will reset JS chunk sizes)"
                : "Use cached data when available"}
            </TooltipContent>
          </Tooltip>

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
