"use client";

import { useEffect, useRef, useState } from "react";

import { SITE_URL } from "@/lib/site";

type NavbarMessage = {
  type: "hocam-tools-navbar-size";
  surface: "top" | "bottom";
  height: number;
  visible: boolean;
};

const MAIN_ORIGIN = process.env.NEXT_PUBLIC_MAIN_ORIGIN || SITE_URL;

/** Both frames render the existing Hocam navbar; tools never maintain a copy. */
export function SharedNavbar() {
  const topRef = useRef<HTMLIFrameElement>(null);
  const bottomRef = useRef<HTMLIFrameElement>(null);
  const [topHeight, setTopHeight] = useState<number | null>(null);
  const [bottomHeight, setBottomHeight] = useState(64);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent<NavbarMessage>) => {
      if (event.origin !== new URL(MAIN_ORIGIN).origin) return;
      const message = event.data;
      if (message?.type !== "hocam-tools-navbar-size" || !Number.isFinite(message.height)) return;
      if (message.surface === "top" && event.source === topRef.current?.contentWindow) {
        setTopHeight(Math.max(56, Math.min(message.height, window.innerHeight)));
      }
      if (message.surface === "bottom" && event.source === bottomRef.current?.contentWindow) {
        setBottomHeight(Math.max(64, Math.min(message.height, window.innerHeight)));
        setShowBottom(message.visible);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <>
      <div className="sticky top-0 z-50 h-14 bg-surface md:h-[120px]">
        <iframe
          ref={topRef}
          title="Hocam ana menü"
          src={`${MAIN_ORIGIN}/internal/tools-navbar?surface=top`}
          className="absolute inset-x-0 top-0 h-full w-full border-0 bg-transparent"
          style={topHeight === null ? undefined : { height: topHeight }}
        />
      </div>
      <iframe
        ref={bottomRef}
        title="Hocam mobil menü"
        src={`${MAIN_ORIGIN}/internal/tools-navbar?surface=bottom`}
        className={`fixed inset-x-0 bottom-0 z-50 w-full border-0 bg-transparent md:hidden ${showBottom ? "" : "pointer-events-none invisible"}`}
        style={{ height: bottomHeight }}
      />
    </>
  );
}
