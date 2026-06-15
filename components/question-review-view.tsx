"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { ArrowLeft, ChevronDown, Check, X, Gauge, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MathText } from "@/components/math-text"
import type { TestResult, SectionResult, QuestionResult } from "@/lib/types"

interface QuestionReviewViewProps {
  result: TestResult
  onBackToAnalytics: () => void
}

type SectionId = "QASA" | "QA" | "VARC"

const SECTIONS = [
  { id: "QASA" as SectionId, label: "QASA", sublabel: "TITA · 15 questions" },
  { id: "QA"   as SectionId, label: "QA",   sublabel: "MCQ · 30 questions"  },
  { id: "VARC" as SectionId, label: "VARC", sublabel: "MCQ · 45 questions"  },
]

const DIFFICULTY_TONE: Record<string, string> = {
  Easy:   "bg-secondary text-primary",
  Medium: "bg-amber-100 text-amber-700",
  Hard:   "bg-destructive/10 text-destructive",
}

// ── Helper: renders question text with line breaks ──────────────────────────
function QuestionText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n").filter(Boolean)
  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, i) => (
        <MathText key={i} text={line} className={className} />
      ))}
    </div>
  )
}

// ── Section Dropdown ────────────────────────────────────────────────────────
function SectionDropdown({ active, onChange }: { active: SectionId; onChange: (id: SectionId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const current = SECTIONS.find(s => s.id === active)!
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-base font-semibold text-foreground transition-colors hover:border-primary/40"
      >
        {current.label}
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onChange(s.id); setOpen(false) }}
              className={cn(
                "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors",
                s.id === active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
              )}
            >
              <span className="text-sm font-semibold">{s.label}</span>
              <span className="text-xs text-muted-foreground">{s.sublabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export function QuestionReviewView({ result, onBackToAnalytics }: QuestionReviewViewProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("QASA")
  const [activeIdx, setActiveIdx]         = useState(0)
  const [showSolution, setShowSolution]   = useState(false)

  const sectionResult: SectionResult = useMemo(
    () => result.sections.find(s => s.sectionId === activeSection) ?? result.sections[0],
    [result, activeSection]
  )

  const qr: QuestionResult = sectionResult.questions[activeIdx] ?? sectionResult.questions[0]
  const q = qr.question

  const passageText = useMemo(() => {
    if (!q.passage_key) return null
    const first = sectionResult.questions.find(r => r.question.passage_key === q.passage_key && r.question.passage_text)
    return first?.question.passage_text ?? null
  }, [q, sectionResult])

  const diDataHtml = useMemo(() => {
    if (!q.di_data_key) return null
    const first = sectionResult.questions.find(r => r.question.di_data_key === q.di_data_key && r.question.di_data_html)
    return first?.question.di_data_html ?? null
  }, [q, sectionResult])

  const isRC    = q.question_type === "rc"
  const isDI    = q.question_type === "di"
  const isSplit = isRC || isDI

  const handleSectionChange = (id: SectionId) => {
    setActiveSection(id)
    setActiveIdx(0)
    setShowSolution(false)
  }

  const selectQuestion = (idx: number) => {
    setActiveIdx(idx)
    setShowSolution(false)
  }

  const statusOf = (qr: QuestionResult) =>
    qr.isSkipped ? "skipped" : qr.isCorrect ? "correct" : "wrong"

  const optionLabel = (key: string) => {
    const map: Record<string, string | null> = {
      a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d
    }
    return map[key] ?? key
  }

  const questionPanel = (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          {q.question_no}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          Question {q.question_no} of {sectionResult.questions.length}
        </span>
      </div>

      <QuestionText text={q.question_text} className="text-pretty text-base leading-relaxed text-foreground" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={cn(
          "flex flex-col gap-1 rounded-xl border p-4",
          qr.isCorrect  && "border-primary/30 bg-secondary",
          !qr.isCorrect && !qr.isSkipped && "border-destructive/30 bg-destructive/5",
          qr.isSkipped  && "border-border bg-muted",
        )}>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Answer</span>
          <span className={cn(
            "flex items-center gap-2 text-lg font-bold",
            qr.isCorrect  && "text-primary",
            !qr.isCorrect && !qr.isSkipped && "text-destructive",
            qr.isSkipped  && "text-muted-foreground",
          )}>
            {qr.isCorrect  && <Check className="size-5" />}
            {!qr.isCorrect && !qr.isSkipped && <X className="size-5" />}
            {qr.studentAnswer
              ? <MathText text={optionLabel(qr.studentAnswer)} />
              : "Not Attempted"}
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-primary/30 bg-secondary p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Correct Answer</span>
          <span className="flex items-center gap-2 text-lg font-bold text-primary">
            <Check className="size-5" />
            <MathText text={q.correct_answer ? optionLabel(q.correct_answer) : "—"} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn(
          "rounded-full px-3 py-1 text-sm font-semibold",
          qr.score > 0   && "bg-secondary text-primary",
          qr.score < 0   && "bg-destructive/10 text-destructive",
          qr.score === 0 && "bg-muted text-muted-foreground",
        )}>
          {qr.score > 0 ? `+${qr.score}` : qr.score} points
        </span>
      </div>

      <div className="rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setShowSolution(s => !s)}
          aria-expanded={showSolution}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Show Solution
          <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", showSolution && "rotate-180")} />
        </button>
        {showSolution && (
          <div className="border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-300">
            <MathText text={q.explanation ?? "No solution available."} />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBackToAnalytics} className="gap-1.5 bg-transparent">
            <ArrowLeft className="size-4" />Back to Analytics
          </Button>
          <SectionDropdown active={activeSection} onChange={handleSectionChange} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
            DIFFICULTY_TONE[q.difficulty ?? "Medium"]
          )}>
            <Gauge className="size-3.5" />
            {q.difficulty ?? "Medium"}
          </span>
        </div>
      </div>

      <div className={cn(
        "grid grid-cols-1 gap-5",
        isSplit ? "xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_280px]" : "lg:grid-cols-[1fr_280px]"
      )}>

        {isRC && (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">
                {q.passage_key === "varc-conv-1" ? "Conversation Transcript" : "Passage"}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <BookOpen className="size-3.5" />
                {q.passage_key === "varc-conv-1" ? "Q35–Q40" : q.passage_key === "varc-rc-2" ? "Q7–Q12" : "Q1–Q6"}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-6" style={{ maxHeight: "560px" }}>
              {passageText
                ? passageText.split("\n\n").map((para, idx) => (
                    <p key={idx} className={cn("text-[15px] leading-[1.95] text-foreground tracking-wide", idx > 0 && "mt-5")}>{para}</p>
                  ))
                : <p className="text-sm text-muted-foreground">Passage not available.</p>
              }
            </div>
          </div>
        )}

        {isDI && (
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary w-fit">Data Viewer</span>
            {diDataHtml
              ? <div
                  className="overflow-x-auto rounded-xl border border-border text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:bg-secondary [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-primary [&_td]:border-t [&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_tr:nth-child(even)]:bg-muted/40"
                  dangerouslySetInnerHTML={{ __html: diDataHtml }}
                />
              : <p className="text-sm text-muted-foreground">Data not available.</p>
            }
          </div>
        )}

        {questionPanel}

        <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Questions</h2>
          <div className="grid grid-cols-5 gap-2">
            {sectionResult.questions.map((qr, idx) => {
              const st = statusOf(qr)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectQuestion(idx)}
                  aria-label={`Question ${qr.question.question_no}, ${st}`}
                  aria-current={idx === activeIdx ? "true" : undefined}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg text-sm font-semibold tabular-nums transition-all hover:scale-105",
                    st === "correct" && "bg-primary text-primary-foreground",
                    st === "wrong"   && "bg-destructive/15 text-destructive",
                    st === "skipped" && "bg-muted text-muted-foreground",
                    idx === activeIdx && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                  )}
                >
                  {qr.question.question_no}
                </button>
              )
            })}
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <LegendItem className="bg-primary"        label="Correct" />
            <LegendItem className="bg-destructive/15" label="Wrong"   />
            <LegendItem className="bg-muted"          label="Skipped" />
          </div>
        </aside>
      </div>
    </div>
  )
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={cn("size-4 rounded", className)} aria-hidden="true" />
      {label}
    </div>
  )
}