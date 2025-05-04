"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/utils";
import { useIsMounted } from "@/hooks/use-is-mounted";

export function ModeToggler() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const isMounted = useIsMounted();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const lightRef = React.useRef<HTMLButtonElement>(null);
  const systemRef = React.useRef<HTMLButtonElement>(null);
  const darkRef = React.useRef<HTMLButtonElement>(null);

  const springConfig = {
    stiffness: 300,
    damping: 30,
  };

  const clipLeft = useSpring(0, springConfig);
  const clipRight = useSpring(66, springConfig);
  const motionClipPath = useMotionTemplate`inset(0 ${clipRight}% 0 ${clipLeft}% round 1.5rem)`;

  const getCurrentRef = () => {
    const current =
      theme === "system" ? systemRef : theme === "dark" ? darkRef : lightRef;
    return current.current;
  };

  React.useLayoutEffect(() => {
    if (!isMounted) return;

    const container = containerRef.current;
    const activeButton = getCurrentRef();

    if (container && activeButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      const leftPercent =
        ((buttonRect.left - containerRect.left) / containerRect.width) * 100;
      const rightPercent =
        100 -
        ((buttonRect.right - containerRect.left) / containerRect.width) * 100;

      clipLeft.set(Math.floor(leftPercent));
      clipRight.set(Math.floor(rightPercent));
    }
  }, [theme, resolvedTheme, isMounted]);

  if (!isMounted()) {
    //TODO: Change to a loading skeleton
    return <div className="fixed top-6 right-6 z-50">loading</div>;
  }

  const filterId = `bg-filter-${resolvedTheme}`;

  return (
    <div className="fixed top-6 right-6 z-50 rounded-3xl bg-surface-secondary p-1 shadow-md border border-subtle overflow-hidden">
      <AnimatePresence>
        <motion.svg
          key={resolvedTheme}
          width="0"
          height="0"
          className="absolute inset-0 w-full h-full z-30 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <defs>
            <filter id={filterId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency={resolvedTheme === "dark" ? "0.6 0.9" : "0.4 0.7"}
                numOctaves="3"
                seed={resolvedTheme === "dark" ? 10 : 5}
                stitchTiles="stitch"
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale={resolvedTheme === "dark" ? 15 : 10}
              />
            </filter>
          </defs>
          <rect
            width="100%"
            height="100%"
            filter={`url(#${filterId})`}
            className="fill-surface-secondary opacity-50 dark:opacity-30"
          />
        </motion.svg>
      </AnimatePresence>

      <div
        ref={containerRef}
        className="relative flex items-center rounded-3xl bg-surface-secondary shadow-md border border-subtle overflow-hidden"
      >
        <motion.div
          className="flex items-center justify-around w-full absolute inset-0 bg-primary z-10"
          style={{
            clipPath: motionClipPath,
            WebkitClipPath: motionClipPath,
          }}
        >
          <button
            className="flex-1 p-2 rounded-3xl focus:outline-none cursor-pointer"
            aria-label="Switch to light mode"
          >
            <Sun
              className={cn(
                "w-4 h-4",
                theme === "light"
                  ? "text-foreground-on-accent"
                  : "text-foreground-subtle hover:text-foreground-default"
              )}
            />
          </button>

          <button
            className="flex-1 p-2 rounded-3xl focus:outline-none cursor-pointer"
            aria-label="Switch to system theme"
          >
            <Monitor
              className={cn(
                `w-4 h-4 ${
                  theme === "system"
                    ? "text-foreground-on-accent"
                    : "text-foreground-subtle hover:text-foreground-default"
                }`
              )}
            />
          </button>

          <button
            className="flex-1 p-2 rounded-3xl focus:outline-none cursor-pointer"
            aria-label="Switch to dark mode"
          >
            <Moon
              className={cn(
                "w-4 h-4",
                theme === "dark"
                  ? "text-foreground-on-accent"
                  : "text-foreground-subtle hover:text-foreground-default"
              )}
            />
          </button>
        </motion.div>

        <div className="flex items-center justify-around w-full">
          <button
            ref={lightRef}
            onClick={() => setTheme("light")}
            className="flex-1 p-2 rounded-3xl focus:outline-none cursor-pointer"
            aria-label="Switch to light mode"
          >
            <Sun
              className={cn(
                "w-4 h-4",
                theme === "light"
                  ? "text-foreground-on-accent"
                  : "text-foreground-subtle hover:text-foreground-default"
              )}
            />
          </button>

          <button
            ref={systemRef}
            onClick={() => setTheme("system")}
            className="flex-1 p-2 rounded-3xl focus:outline-none cursor-pointer"
            aria-label="Switch to system theme"
          >
            <Monitor
              className={cn(
                `w-4 h-4 ${
                  theme === "system"
                    ? "text-foreground-on-accent"
                    : "text-foreground-subtle hover:text-foreground-default"
                }`
              )}
            />
          </button>

          <button
            ref={darkRef}
            onClick={() => setTheme("dark")}
            className="flex-1 p-2 rounded-3xl focus:outline-none cursor-pointer"
            aria-label="Switch to dark mode"
          >
            <Moon
              className={cn(
                "w-4 h-4",
                theme === "dark"
                  ? "text-foreground-on-accent"
                  : "text-foreground-subtle hover:text-foreground-default"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
