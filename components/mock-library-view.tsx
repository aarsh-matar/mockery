"use client"

import { ArrowLeft, Clock, FileText, Play, BarChart2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TestResult } from "@/lib/types"

interface MockLibraryViewProps {
  onBack: () => void
  onStartTest: (testId: string) => void
  onViewAnalysis: (testId: string) => void
  results: Record<string, TestResult>
}

const mockTests = [
  { id: "Mock-1", title: "IPMAT Indore Mock 1", questions: 90, duration: 120, available: true  },
  { id: "Mock-2", title: "IPMAT Indore Mock 2", questions: 90, duration: 120, available: false },
  { id: "Mock-3", title: "IPMAT Indore Mock 3", questions: 90, duration: 120, available: false  },
  { id: "Mock-4", title: "IPMAT Indore Mock 4", questions: 90, duration: 120, available: false },
  { id: "Mock-5", title: "IPMAT Indore Mock 5", questions: 90, duration: 120, available: false },
  { id: "Mock-6", title: "IPMAT Indore Mock 6", questions: 90, duration: 120, available: false },
  { id: "Mock-7", title: "IPMAT Indore Mock 7", questions: 90, duration: 120, available: false },
  { id: "Mock-8", title: "IPMAT Indore Mock 8", questions: 90, duration: 120, available: false },
  { id: "Mock-9", title: "IPMAT Indore Mock 9", questions: 90, duration: 120, available: false },
]

export function MockLibraryView({ onBack, onStartTest, onViewAnalysis, results }: MockLibraryViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Dashboard
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">Mock Tests</h1>
          <p className="text-muted-foreground">Choose a test and start when you&apos;re ready.</p>
        </div>
      </header>

      <section aria-label="Available mock tests" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {mockTests.map((test) => {
          const result = results[test.id]
          const attempted = !!result
          const scorePercent = attempted
            ? Math.round((result.totalScore / result.maxScore) * 100)
            : null

          return (
            <article
            key={test.id}
            className={cn(
              "flex flex-col gap-5 rounded-2xl border p-6 shadow-sm transition-shadow",
              test.available
                ? "border-border bg-card hover:border-primary/40 hover:shadow-md"
                : "border-border bg-muted/40 opacity-60"
            )}
          >
              <div className="flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <FileText className="size-5" aria-hidden="true" />
                </span>
                {attempted ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Attempted
                  </span>
                ) : (
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                    {test.id}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-foreground">{test.title}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden="true" />
                    {test.duration} mins
                  </span>
                  <span>{test.questions} questions</span>
                </div>
              </div>

              {/* Score strip — only shown after attempt */}
              {attempted && result && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Your Score</span>
                    <span className="text-xl font-bold text-primary">
                      {result.totalScore}
                      <span className="text-sm font-medium text-muted-foreground">
                        /{result.maxScore}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Percentage</span>
                    <span className="text-xl font-bold text-foreground">{scorePercent}%</span>
                  </div>
                </div>
              )}

              {/* Buttons */}
              {attempted ? (
                <div className="mt-auto flex flex-col gap-2">
                  <Button
                    onClick={() => onViewAnalysis(test.id)}
                    className="h-11 w-full gap-2 font-semibold"
                  >
                    <BarChart2 className="size-4" aria-hidden="true" />
                    View Analysis
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onStartTest(test.id)}
                    className="h-11 w-full gap-2 bg-transparent font-medium text-muted-foreground"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Retake
                  </Button>
                </div>
              ) : test.available ? (
                <Button
                  onClick={() => onStartTest(test.id)}
                  className="mt-auto h-11 w-full gap-2 font-semibold"
                >
                  <Play className="size-4 fill-current" aria-hidden="true" />
                  Start Test
                </Button>
              ) : (
                <div className="mt-auto flex h-11 w-full items-center justify-center rounded-xl border border-border bg-muted text-sm font-semibold text-muted-foreground">
                  Coming Soon
                </div>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}