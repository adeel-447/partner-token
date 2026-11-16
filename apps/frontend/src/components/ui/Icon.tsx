import type { SVGProps } from "react";

type IconName = "wallet" | "plus" | "arrow-up-right" | "gift" | "clock" | "close" | "arrow-down-left";

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    wallet: <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M16 15h.01M7 6V4a1 1 0 0 1 1-1h11" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    "arrow-up-right": <><path d="M7 17 17 7M7 7h10v10" /></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M12 8H7.5a2.5 2.5 0 1 1 2.4-3.2L12 8Zm0 0h4.5a2.5 2.5 0 1 0-2.4-3.2L12 8Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    "arrow-down-left": <><path d="M7 7 17 17M17 7v10H7" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name]}</svg>;
}
