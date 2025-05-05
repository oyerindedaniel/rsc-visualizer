import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggler } from "@/components/mode-toggler";
import { fontVariables } from "@/assets/fonts";
import { Toaster } from "@/components/ui/sonner";

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
          {children}
          <ModeToggler />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
