"use client";

import { useEffect, useRef, useState } from "react";
import { CHECKPOINTS, hex } from "@/lib/checkpoints";

const BITS = 30;
const STEP = 13; // how far each card peeks out below the one above it
const TOP = 88; // where the stack pins

function Card({
  title,
  subtitle,
  reward,
  index,
  total,
}: {
  title: string;
  subtitle: string;
  reward: number;
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const [written, setWritten] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setWritten(true);
          io.disconnect();
        }
      },
      { rootMargin: "-10% 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      className="sticky"
      style={{ top: TOP + index * STEP, zIndex: index + 1 }}
    >
      <article
        className="card group relative overflow-hidden border border-line-strong bg-card px-6 py-8 transition-colors duration-500 hover:border-accent sm:px-10 sm:py-10"
        style={{ marginBottom: 26 }}
      >
        {/* the cell grid this card is cut from */}
        <span aria-hidden="true" className="card-grid" />

        <div className="relative flex items-start justify-between gap-6">
          <span className="font-mono text-[11px] text-faint transition-colors duration-300 group-hover:text-accent">
            {hex(index + 1)}
          </span>
          <span className="font-mono text-[11px] text-faint">
            {index + 1}/{total}
          </span>
        </div>

        <h3 className="relative mt-6 font-display text-[clamp(1.9rem,4vw,2.9rem)] leading-[1.02] tracking-[-0.02em]">
          {title}
        </h3>
        <p className="relative mt-3 max-w-lg text-[14px] leading-relaxed text-dim">
          {subtitle}
        </p>

        <div className="relative mt-8 flex items-center gap-5">
          <span className="font-mono text-[11px] whitespace-nowrap text-accent">
            +{reward}
          </span>
          <span className="flex flex-1 gap-[3px]" aria-hidden="true">
            {Array.from({ length: BITS }, (_, i) => (
              <span
                key={i}
                className="bit h-[3px] flex-1"
                style={{
                  backgroundColor: written ? "var(--fg)" : "var(--rule)",
                  opacity: written ? 1 : 0.2,
                  transitionDelay: `${i * 22}ms`,
                }}
              />
            ))}
          </span>
        </div>
      </article>
    </li>
  );
}

export default function Checkpoints() {
  return (
    <ol className="relative">
      {CHECKPOINTS.map((c, i) => (
        <Card
          key={c.id}
          {...c}
          index={i}
          total={CHECKPOINTS.length}
        />
      ))}
    </ol>
  );
}
