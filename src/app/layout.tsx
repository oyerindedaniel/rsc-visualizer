import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggler } from "@/components/mode-toggler";
import { fontVariables } from "@/assets/fonts";
import { Toaster } from "@/components/ui/sonner";
import { ResourceProvider } from "@/contexts/resource-context";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "RSC Visualizer",
  description: "Analyze Next.js RSC applications",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "antialiased min-h-dvh h-full bg-background text-foreground font-mono",
          fontVariables
        )}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            <ResourceProvider>
              <Link
                href="/"
                className="fixed top-4 left-4 z-50 flex items-center gap-2 group"
              >
                <Image
                  src="/next.svg"
                  alt="Next.js Logo"
                  width={24}
                  height={24}
                  unoptimized
                  priority
                  className="dark:invert group-hover:scale-110 transition-transform duration-200"
                />
                <span className="text-sm font-semibold text-foreground-primary group-hover:text-primary transition-colors">
                  RSC Visualizer
                </span>
              </Link>

              {children}
              <ModeToggler />
              <Toaster />
            </ResourceProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
