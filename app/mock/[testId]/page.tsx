"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { TestEngineView } from "@/components/test-engine-view"
import { Maximize2, AlertTriangle } from "lucide-react"
import type { TestResult } from "@/lib/types"

export default function MockPage() {
  const params = useParams()
  const testId = typeof params.testId === "string" ? params.testId : "Mock-1"
  const [started, setStarted] = useState(false)

  // ── Tab-switch guard ──────────────────────────────────────────
  const [violations, setViolations]       = useState(0)
  const [showWarning, setShowWarning]     = useState(false)
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  const violationsRef                     = useRef(0)
  const forceSubmitRef = useRef<(() => void) | null>(null)
  const MAX_VIOLATIONS = 3
  // ─────────────────────────────────────────────────────────────

 // Apply saved dark mode preference in this tab
useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])
  // ── Visibility listener (only active after test starts) ───────
  useEffect(() => {
    if (!started) return

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        violationsRef.current += 1
        setViolations(violationsRef.current)
      } else {
        const count = violationsRef.current
        if (count >= MAX_VIOLATIONS) {
          setAutoSubmitted(true)
          setShowWarning(true)
          forceSubmitRef.current?.()
        } else {
          setShowWarning(true)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [started])
  // ─────────────────────────────────────────────────────────────

  const enterFullscreenAndStart = async () => {
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // Fullscreen denied — proceed anyway
    }
    setStarted(true)
  }

  const handleExit = (result: TestResult) => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    if (window.opener) {
      window.opener.postMessage({ type: "TEST_COMPLETE", testId, result }, "*")
      window.close()
    } else {
      window.location.href = "/"
    }
  }

  if (!started) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Maximize2 className="size-8" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ready to begin?</h1>
          <p className="max-w-sm text-muted-foreground">
            The test will open in fullscreen mode. Do not switch tabs or exit fullscreen during the exam.
          </p>
        </div>
        <button
          onClick={enterFullscreenAndStart}
          className="h-14 rounded-xl bg-primary px-10 text-base font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
        >
          Enter Fullscreen &amp; Start {testId}
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background px-4 py-6">

      {/* ── Warning overlay ──────────────────────────────────────── */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-background p-8 shadow-2xl">

            {autoSubmitted ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="size-7 text-destructive" />
                </span>
                <h2 className="text-xl font-semibold text-foreground">Test Auto-Submitted</h2>
                <p className="text-muted-foreground">
                  You switched tabs <strong>{MAX_VIOLATIONS} times</strong>. Your test has been submitted automatically.
                </p>
                <p className="text-sm text-muted-foreground">This window will close shortly…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/10">
                  <AlertTriangle className="size-7 text-amber-500" />
                </span>
                <h2 className="text-xl font-semibold text-foreground">Tab Switch Detected</h2>
                <p className="text-muted-foreground">
                  You have left the exam window.
                </p>

                <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2">
                  <span className="text-sm font-semibold text-destructive">
                    Warning {violations} of {MAX_VIOLATIONS}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: MAX_VIOLATIONS }).map((_, i) => (
                      <span
                        key={i}
                        className={`size-2 rounded-full ${
                          i < violations ? "bg-destructive" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {MAX_VIOLATIONS - violations} more switch{MAX_VIOLATIONS - violations === 1 ? "" : "es"} will auto-submit your test.
                </p>

                <button
                  onClick={() => setShowWarning(false)}
                  className="mt-2 h-11 w-full rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Resume Test
                </button>
              </div>
            )}

          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────── */}

      <TestEngineView
        testId={testId}
        onExit={handleExit}
        forceSubmitRef={forceSubmitRef}
      />
    </div>
  )
}