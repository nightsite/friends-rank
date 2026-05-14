export type DesktopBridge = {
  isDesktop: boolean;
  openExternal: (url: string) => Promise<boolean>;
  copyText: (value: string) => Promise<boolean>;
  notify: (title: string, body: string) => Promise<boolean>;
};

declare global {
  interface Window {
    desktopApi?: DesktopBridge;
  }
}

const fallback: DesktopBridge = {
  isDesktop: false,
  openExternal: async (url: string) => {
    if (typeof window === "undefined") return false;
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  },
  copyText: async (value: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  },
  notify: async (title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "default") {
      await Notification.requestPermission().catch(() => "denied");
    }
    if (Notification.permission !== "granted") return false;
    new Notification(title, { body });
    return true;
  },
};

export function getDesktopBridge(): DesktopBridge {
  if (typeof window === "undefined") return fallback;
  return window.desktopApi ?? fallback;
}
