import {
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import type { UIMessage } from "ai";

const HEADER_HEIGHT = 70; // --header-height
const SCROLL_PADDING = 16; // breathing room below header

/**
 * Scroll behavior that positions each new user message at the top of the
 * viewport, just below the sticky header.
 *
 * Uses min-height (not dynamic padding-bottom) to guarantee scrollability.
 * min-height only ever grows during a streaming session, so scrollHeight
 * never shrinks and the browser never clamps scrollTop — eliminating jitter.
 */
export function useChatScroll(messages: UIMessage[], status: string) {
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const getContainer = useCallback(
    () =>
      document.querySelector(".chat-scroll-container") as HTMLElement | null,
    [],
  );

  const getInputHeight = useCallback(() => {
    const el = document.querySelector(
      ".chat-input-area",
    ) as HTMLElement | null;
    return el?.offsetHeight ?? 0;
  }, []);

  // ── 1. Min-height + padding + scroll-on-new-user-message ──────────
  // Runs in useLayoutEffect (before paint) to avoid visual flash.
  useLayoutEffect(() => {
    const mc = messagesContainerRef.current;
    const container = getContainer();
    const userMsg = lastUserMessageRef.current;
    const inputHeight = getInputHeight();

    // Always clear the fixed input overlay
    if (mc) mc.style.paddingBottom = `${inputHeight + 16}px`;

    if (!mc || !container || !userMsg || messages.length === 0) {
      if (mc) mc.style.minHeight = "";
      return;
    }

    // Phase 1: Set a generous min-height that guarantees the user message
    // can scroll to the top. This is intentionally too large — Phase 2 trims it.
    mc.style.minHeight = `${userMsg.offsetTop + container.clientHeight}px`;

    // Phase 2: Measure actual scroll geometry and trim the excess so
    // maxScrollTop === targetScrollTop (no extra scrollable space).
    // getBoundingClientRect forces reflow incorporating Phase 1's min-height.
    const elRect = userMsg.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const elOffset = elRect.top - containerRect.top + container.scrollTop;
    const targetScrollTop = Math.max(
      0,
      elOffset - HEADER_HEIGHT - SCROLL_PADDING,
    );

    const excess =
      container.scrollHeight - container.clientHeight - targetScrollTop;
    if (excess > 0) {
      const current = parseFloat(mc.style.minHeight) || 0;
      mc.style.minHeight = `${Math.max(0, current - excess)}px`;
    }

    // Detect new user message and scroll it to just below the header
    const count = messages.length;
    if (count > prevMessageCountRef.current) {
      const newMsgs = messages.slice(prevMessageCountRef.current);
      if (newMsgs.some((m) => m.role === "user")) {
        autoScrollRef.current = true;
        setShowScrollButton(false);

        container.scrollTo({
          top: targetScrollTop,
          behavior: "instant",
        });
      }
    }
    prevMessageCountRef.current = count;
  }, [messages, status, getContainer, getInputHeight]);

  // ── 2. Auto-scroll during streaming ───────────────────────────────
  useEffect(() => {
    if (!autoScrollRef.current || status !== "streaming") return;

    const container = getContainer();
    const sentinel = contentEndRef.current;
    if (!container || !sentinel) return;

    requestAnimationFrame(() => {
      const sentinelRect = sentinel.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const inputHeight = getInputHeight();
      const visibleBottom = containerRect.bottom - inputHeight;

      if (sentinelRect.bottom > visibleBottom - 20) {
        container.scrollTop += sentinelRect.bottom - visibleBottom + 40;
      }
    });
  }, [messages, status, getContainer, getInputHeight]);

  // ── 3. Detect manual scroll to pause / resume auto-scroll ─────────
  useEffect(() => {
    const container = getContainer();
    if (!container) return;

    let lastScrollTop = container.scrollTop;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const cur = container.scrollTop;

        // Scrolled up → pause auto-scroll
        if (
          cur < lastScrollTop - 10 &&
          (status === "streaming" || status === "submitted")
        ) {
          autoScrollRef.current = false;
          setShowScrollButton(true);
        }

        // Near content end → resume auto-scroll
        const sentinel = contentEndRef.current;
        if (sentinel) {
          const sRect = sentinel.getBoundingClientRect();
          const cRect = container.getBoundingClientRect();
          const inputH = getInputHeight();
          if (sRect.top < cRect.bottom - inputH + 80) {
            autoScrollRef.current = true;
            setShowScrollButton(false);
          }
        }

        lastScrollTop = cur;
        ticking = false;
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [status, getContainer, getInputHeight]);

  // ── Scroll-to-bottom button handler ───────────────────────────────
  const scrollToBottom = useCallback(() => {
    autoScrollRef.current = true;
    setShowScrollButton(false);

    const container = getContainer();
    const sentinel = contentEndRef.current;
    const userMsg = lastUserMessageRef.current;
    if (!container) return;

    if (sentinel && userMsg) {
      const cRect = container.getBoundingClientRect();
      const inputH = getInputHeight();

      // Option A: user message at top of viewport
      const uRect = userMsg.getBoundingClientRect();
      const uOffset = uRect.top - cRect.top + container.scrollTop;
      const userMsgScroll = uOffset - HEADER_HEIGHT - SCROLL_PADDING;

      // Option B: content end near bottom of viewport (above input)
      const sRect = sentinel.getBoundingClientRect();
      const sOffset = sRect.top - cRect.top + container.scrollTop;
      const contentEndScroll = sOffset - container.clientHeight + inputH + 60;

      // Whichever is larger shows the most recent content
      container.scrollTo({
        top: Math.max(0, Math.max(userMsgScroll, contentEndScroll)),
        behavior: "smooth",
      });
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [getContainer, getInputHeight]);

  return {
    lastUserMessageRef,
    contentEndRef,
    messagesContainerRef,
    showScrollButton,
    scrollToBottom,
  };
}
