import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export function PageShell({ children, title, description, actions }: Props) {
  return (
    <div className="space-y-8 page-enter">
      {(title || description || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h1 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-zinc-400">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      <div className="page-enter-children">{children}</div>
    </div>
  );
}
