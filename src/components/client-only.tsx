"use client";

import { ReactNode } from "react";
import { useIsMounted } from "@/hooks/use-is-mounted";

type ClientOnlyProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const isMounted = useIsMounted();

  if (!isMounted()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
