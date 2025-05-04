import { useEffect, useState } from "react";

/**
 * Custom React hook to determine if the component is currently mounted.
 *
 * @returns A function that returns `true` if the component is mounted, `false` otherwise.
 */
export function useIsMounted(): () => boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return () => isMounted;
}
