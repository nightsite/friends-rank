import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = "", hover = true }: Props) {
  return (
    <div
      className={`glass-panel rounded-2xl p-5 sm:p-6 ${hover ? "card-hover" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
