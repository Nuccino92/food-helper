import { useEffect, useRef, useState } from "react";

export function useScrollToBottom<T extends HTMLElement>() {
  const containerRef = useRef<T>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // 1. Check if user is at bottom on scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // If user is within 100px of bottom, they are "at bottom"
      const isClose = distanceFromBottom < 100;
      setIsAtBottom(isClose);
      setShowScrollButton(!isClose);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Helper to scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior, block: "end" });
    setIsAtBottom(true);
    setShowScrollButton(false);
  };

  return {
    containerRef,
    endRef,
    isAtBottom,
    showScrollButton,
    scrollToBottom,
  };
}
