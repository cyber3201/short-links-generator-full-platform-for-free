"use client";

import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import React from "react";

type From = "left" | "right" | "top" | "bottom";

interface HighlightedTextProps {
  children: React.ReactNode;
  className?: string;
  from?: From;
  delay?: number;
  inView?: boolean;
  once?: boolean;
}

const fromVariants = {
  left: {
    hidden: { x: "-100%" },
    visible: { x: "0%" },
  },
  right: {
    hidden: { x: "100%" },
    visible: { x: "0%" },
  },
  top: {
    hidden: { y: "-100%" },
    visible: { y: "0%" },
  },
  bottom: {
    hidden: { y: "100%" },
    visible: { y: "0%" },
  },
};

export function HighlightedText({
  children,
  className,
  from = "bottom",
  delay = 0,
  inView = false,
  once = true,
}: HighlightedTextProps) {
  const variants = fromVariants[from];

  return (
    <motion.span
      className={cn(
        "relative inline-flex overflow-hidden align-baseline",
        className,
      )}
      initial="hidden"
      whileInView={inView ? "visible" : undefined}
      animate={inView ? undefined : "visible"}
      viewport={{ once }}
    >
      <motion.span
        className="absolute inset-0 -left-[0.15em] -right-[0.18em] bg-primary z-0 rounded-sm"
        variants={variants}
        transition={{
          duration: 1.25,
          ease: "easeInOut",
          delay,
        }}
      />
      <span className="relative z-10 text-primary-foreground pl-[0.15em] pr-[0.18em] font-semibold">
        {children}
      </span>
    </motion.span>
  );
}

export default HighlightedText;
