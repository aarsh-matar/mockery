"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Clock, Flag, ChevronLeft, ChevronRight, BookOpen, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fetchMockQuestions, type Question } from "@/lib/questions"
import { MathText } from "@/components/math-text"
import { TitaKeypad } from "@/components/tita-keypad"
import { Calculator } from "@/components/calculator"
import type { TestResult, SectionResult, QuestionResult } from "@/lib/types"

interface TestEngineViewProps {
  testId: string
  onExit: (result: TestResult) => void
  forceSubmitRef?: React.MutableRefObject<(() => void) | null>
}

type QuestionStatus = "unanswered" | "answered" | "marked"

const SECTION_ORDER = ["QASA", "QA", "VARC"]

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0")
  const s = (seconds % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

interface SectionState {
  current: number
  answers: Record<number, string>
  status: Record<number, QuestionStatus>
  completed: boolean
}

function makeInitialState(): SectionState {
  return { current: 0, answers: {}, status: {}, completed: false }
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 animate-pulse">
      <div className="h-20 rounded-2xl bg-muted" />
      <div className="flex gap-2">
        <div className="h-9 w-32 rounded-full bg-muted" />
        <div className="h-9 w-32 rounded-full bg-muted" />
        <div className="h-9 w-32 rounded-full bg-muted" />
      </div>
      <div className="grid grid-cols-[1fr_300px] gap-5">
        <div className="h-96 rounded-2xl bg-muted" />
        <div className="h-96 rounded-2xl bg-muted" />
      </div>
    </div>
  )
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

export function TestEngineView({ testId, onExit, forceSubmitRef }: TestEngineViewProps) {
  const [questions, setQuestions]     = useState<Question[]>([])
  const [loading, setLoading]         = useState(true)
  const [loadError, setLoadError]     = useState<string | null>(null)

  const [sectionIndex, setSectionIndex] = useState(0)
  const [states, setStates]             = useState<SectionState[]>([makeInitialState(), makeInitialState(), makeInitialState()])
  const [timeLeft, setTimeLeft]         = useState(40 * 60)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [showCalc, setShowCalc]         = useState(false)

  const statesRef = useRef(states)
  useEffect(() => { statesRef.current = states }, [states])

  useEffect(() => {
    fetchMockQuestions(testId)
      .then((data) => {
        setQuestions(data)
        setLoading(false)
      })
      .catch((err) => {
        setLoadError(err.message)
        setLoading(false)
      })
  }, [testId])

  const sectionId = SECTION_ORDER[sectionIndex]
  const sectionQuestions = useMemo(
    () => questions.filter((q) => q.section === sectionId).sort((a, b) => a.question_no - b.question_no),
    [questions, sectionId]
  )
  const state    = states[sectionIndex]
  const currentQ = state.current
  const current  = sectionQuestions[currentQ]

  const isDI    = current?.question_type === "di"
  const isRC    = current?.question_type === "rc"
  const isSplit = isDI || isRC

  const passageText = useMemo(() => {
    if (!current?.passage_key) return null
    const first = sectionQuestions.find(q => q.passage_key === current.passage_key && q.passage_text)
    return first?.passage_text ?? null
  }, [current, sectionQuestions])

  const diDataHtml = useMemo(() => {
    if (!current?.di_data_key) return null
    const first = sectionQuestions.find(q => q.di_data_key === current.di_data_key && q.di_data_html)
    return first?.di_data_html ?? null
  }, [current, sectionQuestions])

  const updateState = useCallback(
    (updater: (prev: SectionState) => SectionState) => {
      setStates((prev) => prev.map((s, i) => (i === sectionIndex ? updater(s) : s)))
    },
    [sectionIndex]
  )

  const goToNextSection = useCallback((markCompleted = false) => {
    if (markCompleted) {
      setStates((prev) => prev.map((s, i) => (i === sectionIndex ? { ...s, completed: true } : s)))
    }
    setSectionIndex((prev) => {
      const next = Math.min(prev + 1, SECTION_ORDER.length - 1)
      setTimeLeft(40 * 60)
      return next
    })
  }, [sectionIndex])

  useEffect(() => {
    if (loading) return
    if (timeLeft <= 0) {
      if (sectionIndex < SECTION_ORDER.length - 1) {
        goToNextSection(true)
      } else {
        onExit(calculateResult())
      }
      return
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(id)
  }, [timeLeft, sectionIndex, goToNextSection, loading])

  const isLastSection = sectionIndex === SECTION_ORDER.length - 1

  const calculateResult = (): TestResult => {
    const currentStates = statesRef.current
    const sectionResults: SectionResult[] = SECTION_ORDER.map((secId, si) => {
      const secQuestions = questions
        .filter(q => q.section === secId)
        .sort((a, b) => a.question_no - b.question_no)

      const isTITA  = secId === "QASA"
      const answers = currentStates[si].answers

      let correct = 0, wrong = 0, skipped = 0, score = 0
      const maxScore = secQuestions.length * 4

      const qResults: QuestionResult[] = secQuestions.map((q, idx) => {
        const student     = answers[idx]?.trim().toLowerCase() ?? null
        const correct_ans = q.correct_answer?.trim().toLowerCase() ?? null
        const isSkipped   = !student
        let isCorrect = false
        let pts = 0

        if (isSkipped) {
          skipped++
        } else if (student === correct_ans) {
          isCorrect = true
          correct++
          pts = 4
          score += 4
        } else {
          wrong++
          pts = isTITA ? 0 : -1
          score += isTITA ? 0 : -1
        }

        return { question: q, studentAnswer: answers[idx] ?? null, isCorrect, isSkipped, score: pts }
      })

      return { sectionId: secId, questions: qResults, correct, wrong, skipped, score, maxScore }
    })

    const totalScore = sectionResults.reduce((s, r) => s + r.score, 0)
    const maxScore   = sectionResults.reduce((s, r) => s + r.maxScore, 0)
    return { testId, sections: sectionResults, totalScore, maxScore }
  }

  useEffect(() => {
    if (!forceSubmitRef) return
    forceSubmitRef.current = () => { onExit(calculateResult()) }
    return () => { forceSubmitRef.current = null }
  }, [forceSubmitRef, onExit, questions])

  const handleSwitchSection = (index: number) => {
    if (states[index].completed) return
    const allPriorCompleted = SECTION_ORDER.slice(0, index).every((_, i) => states[i].completed)
    if (!allPriorCompleted) return
    setSectionIndex(index)
    setTimeLeft(40 * 60)
  }

  const setAnswer = (value: string) => {
    updateState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentQ]: value },
      status: {
        ...prev.status,
        [currentQ]: prev.status[currentQ] === "marked" ? "marked" : value ? "answered" : "unanswered",
      },
    }))
  }

  const markForReview = () => {
    updateState((prev) => ({ ...prev, status: { ...prev.status, [currentQ]: "marked" } }))
    goToQuestion(currentQ + 1)
  }

  const saveAndNext = () => {
    updateState((prev) => {
      const answered = prev.answers[currentQ]
      return {
        ...prev,
        status: { ...prev.status, [currentQ]: answered ? "answered" : prev.status[currentQ] ?? "unanswered" },
      }
    })
    goToQuestion(currentQ + 1)
  }

  const goToQuestion = (index: number) => {
    const clamped = Math.max(0, Math.min(index, sectionQuestions.length - 1))
    updateState((prev) => ({ ...prev, current: clamped }))
  }

  const answeredCount = useMemo(
    () => Object.values(state.status).filter((s) => s === "answered").length,
    [state.status]
  )

  if (loading) return <LoadingSkeleton />

  if (loadError) return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <h2 className="text-lg font-semibold text-foreground">Failed to load questions</h2>
      <p className="text-sm text-muted-foreground">{loadError}</p>
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </div>
  )

  if (!current) return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
      <h2 className="text-lg font-semibold text-foreground">No questions found</h2>
      <p className="text-sm text-muted-foreground">No questions found for {testId} — {sectionId}</p>
    </div>
  )

  const MCQ_OPTIONS: { key: "a" | "b" | "c" | "d"; label: string }[] = [
    { key: "a", label: current.option_a ?? "" },
    { key: "b", label: current.option_b ?? "" },
    { key: "c", label: current.option_c ?? "" },
    { key: "d", label: current.option_d ?? "" },
  ]

  const answerInput =
    current.question_type === "tita" ? (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Your answer</label>
        <TitaKeypad
          value={state.answers[currentQ] ?? ""}
          onChange={(val) => setAnswer(val)}
        />
      </div>
    ) : (
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">Choose an answer</legend>
        {MCQ_OPTIONS.filter(o => o.label).map(({ key, label }) => {
          const checked = state.answers[currentQ] === key
          return (
            <label
              key={key}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
                checked ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name={`q-${sectionIndex}-${currentQ}`}
                value={key}
                checked={checked}
                onChange={() => setAnswer(key)}
                className="size-4 accent-primary"
              />
              <MathText text={label} className="text-foreground" />
            </label>
          )
        })}
      </fieldset>
    )

  const navButtons = (
    <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-border pt-5">
      <Button variant="outline" onClick={() => goToQuestion(currentQ - 1)} disabled={currentQ === 0} className="gap-1.5 font-medium bg-transparent">
        <ChevronLeft className="size-4" />Previous
      </Button>
      <Button variant="outline" onClick={markForReview} className="gap-1.5 border-[oklch(0.55_0.18_300)] font-medium text-[oklch(0.5_0.2_300)] hover:bg-[oklch(0.95_0.05_300)] bg-transparent">
        <Flag className="size-4" />Mark for Review
      </Button>
      <Button onClick={saveAndNext} className="ml-auto gap-1.5 font-semibold">
        Save &amp; Next<ChevronRight className="size-4" />
      </Button>
    </div>
  )

  const questionPanel = (splitLabel?: string) => (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">
          Question {current.question_no} of {sectionQuestions.length}
        </span>
        {splitLabel && (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{splitLabel}</span>
        )}
      </div>
      <QuestionText text={current.question_text} className="text-pretty text-lg leading-relaxed text-foreground" />
      {answerInput}
      {navButtons}
    </div>
  )

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 flex w-full max-w-md flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-xl">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {isLastSection ? "Submit the test?" : `Submit ${sectionId}?`}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {isLastSection
                    ? "Your answers will be locked and you'll see your results."
                    : `Once submitted you cannot return to this section. You answered ${answeredCount} of ${sectionQuestions.length} questions.`}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)} className="bg-transparent font-medium">Go back</Button>
              <Button onClick={() => {
                setShowConfirm(false)
                if (isLastSection) {
                  onExit(calculateResult())
                } else {
                  goToNextSection(true)
                }
              }} className="font-semibold">
                {isLastSection ? "Submit test" : "Submit section"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {(sectionId === "QASA" || sectionId === "QA") && showCalc && (
        <Calculator onClose={() => setShowCalc(false)} />
      )}

      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{testId}</span>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Section: {sectionId}</h1>
        </div>
        <div className="flex items-center gap-3">
          {(sectionId === "QASA" || sectionId === "QA") && (
            <button
              type="button"
              onClick={() => setShowCalc(v => !v)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                showCalc
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              Calculator
            </button>
          )}
          <div className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-lg font-semibold tabular-nums",
            timeLeft <= 60 ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-secondary text-primary"
          )} aria-live="polite">
            <Clock className="size-5" />{formatTime(timeLeft)}
          </div>
          <Button onClick={() => setShowConfirm(true)} className="h-11 font-semibold">
            {isLastSection ? "Submit Test" : "Submit Section"}
          </Button>
        </div>
      </header>

      <nav aria-label="Exam sections" className="flex flex-wrap gap-2">
        {SECTION_ORDER.map((s, i) => {
          const isActive    = i === sectionIndex
          const isCompleted = states[i].completed
          const allPrior    = SECTION_ORDER.slice(0, i).every((_, j) => states[j].completed)
          const isLocked    = isCompleted || (!isActive && !allPrior)
          return (
            <button key={s} type="button" onClick={() => handleSwitchSection(i)} disabled={isLocked}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                isActive    && "border-primary bg-primary text-primary-foreground",
                isCompleted && "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60",
                !isActive && !isCompleted && isLocked  && "cursor-not-allowed border-border bg-card text-muted-foreground opacity-40",
                !isActive && !isCompleted && !isLocked && "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isCompleted ? `${s} ✓` : s}
            </button>
          )
        })}
      </nav>

      <div className={cn(
        "grid grid-cols-1 gap-5",
        isSplit
          ? "grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_280px]"
          : "lg:grid-cols-[1fr_300px]"
      )}>

        {isDI && (
          <>
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">Data Viewer</span>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Set {Math.ceil((current.question_no - 25) / 5) || 1}
                </span>
              </div>
              {diDataHtml
                ? (
                  <div
                    className="overflow-x-auto rounded-xl border border-border text-sm [&_table]:w-full [&_table]:border-collapse [&_th]:bg-secondary [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-sm [&_th]:font-semibold [&_th]:text-primary [&_td]:border-t [&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-sm [&_td]:text-foreground [&_tr:nth-child(even)]:bg-muted/40"
                    dangerouslySetInnerHTML={{ __html: diDataHtml }}
                  />
                )
                : <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">Data table loading...</div>
              }
            </div>
            {questionPanel("Data Interpretation")}
          </>
        )}

        {isRC && (
          <>
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">
                  {current.passage_key === "varc-conv-1" ? "Conversation Transcript" : "Passage"}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <BookOpen className="size-3.5" />
                  {current.passage_key === "varc-conv-1" ? "Q35–Q40" : current.passage_key === "varc-rc-2" ? "Q7–Q12" : "Q1–Q6"}
                </span>
              </div>
              <div
                className="flex-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-6"
                style={{ maxHeight: "580px" }}
              >
                {passageText
                  ? passageText.split("\n\n").map((para, idx) => (
                      <p key={idx} className={cn("text-[15px] leading-[1.95] text-foreground tracking-wide", idx > 0 && "mt-5")}>
                        {para}
                      </p>
                    ))
                  : <p className="text-sm text-muted-foreground">Passage loading...</p>
                }
              </div>
            </div>
            {questionPanel(current.passage_key === "varc-conv-1" ? "Conversation Analysis" : "Reading Comprehension")}
          </>
        )}

        {!isSplit && (
          <section className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm xl:col-span-1">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">
                Question {current.question_no} of {sectionQuestions.length}
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {current.question_type === "tita" ? "Type In The Answer" : "Multiple Choice"}
              </span>
            </div>
            <QuestionText text={current.question_text} className="text-pretty text-lg leading-relaxed text-foreground" />
            {answerInput}
            {navButtons}
          </section>
        )}

        <aside className="flex h-fit flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Questions</h2>
            <span className="text-xs text-muted-foreground">{answeredCount}/{sectionQuestions.length} answered</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {sectionQuestions.map((_, i) => {
              const status    = state.status[i] ?? "unanswered"
              const isCurrent = i === currentQ
              return (
                <button key={i} type="button" onClick={() => goToQuestion(i)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition-transform hover:scale-105",
                    status === "answered"   && "bg-primary text-primary-foreground",
                    status === "marked"     && "bg-[oklch(0.5_0.2_300)] text-white",
                    status === "unanswered" && "bg-muted text-muted-foreground",
                    isCurrent && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                  )}
                  aria-label={`Question ${i + 1}, ${status}`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <LegendItem className="bg-muted"                 label="Unanswered" />
            <LegendItem className="bg-primary"               label="Answered" />
            <LegendItem className="bg-[oklch(0.5_0.2_300)]" label="Marked for Review" />
          </div>
        </aside>
      </div>
    </div>
  )
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <span className={cn("size-4 rounded", className)} aria-hidden="true" />
      {label}
    </div>
  )
}