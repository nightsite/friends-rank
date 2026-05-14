"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function RouteTransition({ children }: Props) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="route-transition">
      {children}
    </div>
  );
}
