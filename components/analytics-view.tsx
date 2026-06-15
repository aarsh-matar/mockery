"use client"

import { useMemo } from "react"
import { ArrowRight, Target, Trophy, Check, X, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TestResult, SectionResult } from "@/lib/types"

interface AnalyticsViewProps {
  result: TestResult
  onViewSolutions: () => void
  onBackToLibrary: () => void
}

const SECTION_LABELS: Record<string, string> = {
  QASA: "QASA (TITA)",
  QA:   "QA (MCQ)",
  VARC: "VARC (MCQ)",
}

function accuracyOf(r: SectionResult) {
  const attempted = r.correct + r.wrong
  return attempted === 0 ? 0 : Math.round((r.correct / attempted) * 100)
}

export function AnalyticsView({ result, onViewSolutions, onBackToLibrary }: AnalyticsViewProps) {
  const overallAccuracy = useMemo(() => {
    const totalCorrect  = result.sections.reduce((s, r) => s + r.correct, 0)
    const totalAttempted = result.sections.reduce((s, r) => s + r.correct + r.wrong, 0)
    return totalAttempted === 0 ? 0 : Math.round((totalCorrect / totalAttempted) * 100)
  }, [result])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={onBackToLibrary}
          className="w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          ← Back to Mock Tests
        </button>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Mock Performance Analytics
        </h1>
        <p className="text-sm text-muted-foreground">Results for {result.testId}</p>
      </div>

      {/* Aggregate */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-primary p-6 text-primary-foreground shadow-sm">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Trophy className="size-7" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-primary-foreground/80">Total Score</span>
            <span className="text-4xl font-bold tabular-nums leading-tight">
              {result.totalScore}
              <span className="text-xl font-semibold text-primary-foreground/70"> / {result.maxScore}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Target className="size-7" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">Overall Accuracy</span>
            <span className="text-4xl font-bold tabular-nums leading-tight text-foreground">
              {overallAccuracy}
              <span className="text-xl font-semibold text-muted-foreground">%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Section breakdown */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Section-Wise Breakdown</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {result.sections.map((r) => (
            <SectionCard key={r.sectionId} result={r} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <Button onClick={onViewSolutions} className="mt-2 h-14 w-full gap-2 text-base font-semibold shadow-sm">
        View Detailed Solutions
        <ArrowRight className="size-5" aria-hidden="true" />
      </Button>
    </div>
  )
}

function SectionCard({ result }: { result: SectionResult }) {
  const accuracy = accuracyOf(result)
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h3 className="font-semibold text-foreground">{SECTION_LABELS[result.sectionId] ?? result.sectionId}</h3>
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold tabular-nums text-primary">
          {result.score} / {result.maxScore}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <StatRow icon={<Check className="size-4" />} tone="correct" label="Correct"  value={result.correct} />
        <StatRow icon={<X     className="size-4" />} tone="wrong"   label="Wrong"    value={result.wrong} />
        <StatRow icon={<Minus className="size-4" />} tone="missed"  label="Skipped"  value={result.skipped} />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm font-medium text-muted-foreground">Sectional Accuracy</span>
        <span className="text-lg font-bold tabular-nums text-primary">{accuracy}%</span>
      </div>
    </div>
  )
}

function StatRow({ icon, tone, label, value }: {
  icon: React.ReactNode
  tone: "correct" | "wrong" | "missed"
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={cn(
          "flex size-6 items-center justify-center rounded-md",
          tone === "correct" && "bg-secondary text-primary",
          tone === "wrong"   && "bg-destructive/10 text-destructive",
          tone === "missed"  && "bg-muted text-muted-foreground",
        )} aria-hidden="true">
          {icon}
        </span>
        {label}
      </span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  )
}