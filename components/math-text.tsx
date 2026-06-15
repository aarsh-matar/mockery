"use client"

import { useEffect, useRef } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"

interface MathTextProps {
  text: string
  className?: string
}

export function MathText({ text, className }: MathTextProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current || !text) return

    // Split on $...$ (inline math) and render each part
    const parts = text.split(/(\$[^$]+\$)/)

    ref.current.innerHTML = parts
      .map((part) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          const math = part.slice(1, -1)
          try {
            return katex.renderToString(math, {
              throwOnError: false,
              displayMode: false,
            })
          } catch {
            return part
          }
        }
        // Plain text — escape HTML
        return part
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
      })
      .join("")
  }, [text])

  return <span ref={ref} className={className} />
}