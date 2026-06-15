"use client"

import { useEffect, useState, useMemo } from "react"
import { ArrowRight, Trophy, Clock, Target, BookOpen, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardViewProps {
  onGoToMockTests: () => void
  userName?: string
  mocksAttempted?: number
  avgScore?: number | null
  hoursPracticed?: number
}

const HEADLINES = [
  "Mock dede bhai, warna log mock karenge",
  "Rome was being built everyday.",
  "Ladki/ladka bazzi IIM jake kar liyo, abhi LOCK IN GNG",
  "is that {name}! he/she the one who gonna ball IPMAT Indore",
  "The biggest leverage you have rn is time. and it applies out of IPMAT too gng...",
  "120/360 today is wayyyyyy better than 160/360 6 months later",
  "I have seen people crack it in 2 weeks, i have also seen people who couldn't crack it in 2 years......-BIH BIH",
  "you will learn more analyzing mocks than watching some random ass lecture.",
  "JUST DO IT ✓",
  "It's just an entrance exam for just a clg at the end of the day.",
  "you have done harder things than this gng.",
  "DELETE INSTAGRAM!",
  "LOCK THE FUCK IN!",
  "You slay bitch💅",
  "A porsche died in the garage cuz it waited for all the traffic lights to be green",
]

const EXAM_DATE = new Date("2027-05-04T00:00:00")

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const tick = () => {
      const now  = new Date()
      const diff = EXAM_DATE.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeft({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return timeLeft
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-3xl font-bold tabular-nums text-primary">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function DashboardView({
  onGoToMockTests,
  userName,
  mocksAttempted = 0,
  avgScore = null,
  hoursPracticed = 0,
}: DashboardViewProps) {
  const countdown = useCountdown()

  const stats = [
    { label: "Mocks Attempted", value: String(mocksAttempted),              icon: Target },
    { label: "Avg. Score", value: avgScore !== null ? `${avgScore}/360` : "—", icon: Trophy },
    { label: "Hours Practiced", value: String(hoursPracticed),              icon: Clock  },
  ]

  const headline = useMemo(() => {
    const raw = HEADLINES[Math.floor(Math.random() * HEADLINES.length)]
    return raw.replace("{name}", userName ?? "you")
  }, [userName])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">

      {/* Header */}
      <header className="flex flex-col gap-2">
        <span className="text-sm font-medium text-primary">
          {userName ? `Welcome back, ${userName}!` : "Welcome back"}
        </span>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {headline}
        </h1>
      </header>

      {/* Stats */}
      <section aria-label="Your statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
            <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="text-2xl font-semibold text-foreground">{value}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Mock Test Library */}
      <section className="flex flex-col items-start gap-5 rounded-2xl border border-border bg-card p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-foreground">Mock Test Library</h2>
          <p className="text-muted-foreground">Full-length practice tests, ready when you are.</p>
        </div>
        <Button
          size="lg"
          onClick={onGoToMockTests}
          className="group h-12 w-full gap-2 px-6 text-base font-semibold shadow-md md:w-auto"
        >
          Go to Mock Tests
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Button>
      </section>

      {/* Free Resources + Countdown */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

        {/* Free Resources */}
        <div
          onClick={() => window.open("https://drive.google.com/drive/folders/11SBOkynb9f45GXzWyr53wzjZw6ps4cLp", "_blank")}
          className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <BookOpen className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">Free Resources</span>
              <span className="text-sm text-muted-foreground">PYQs, notes, and more</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Access free study material curated for IPMAT Indore — previous year questions, formula sheets, and topic notes.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5">
            Open Resources
            <ArrowRight className="size-4" />
          </span>
        </div>

        {/* Countdown */}
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <CalendarDays className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-foreground">IPMAT Indore 2027</span>
              <span className="text-sm text-muted-foreground">May 4th — days remaining</span>
            </div>
          </div>

          <div className="flex items-center justify-around rounded-xl border border-border bg-secondary/50 px-4 py-5">
            <CountdownUnit value={countdown.days}    label="Days"    />
            <span className="text-2xl font-bold text-muted-foreground">:</span>
            <CountdownUnit value={countdown.hours}   label="Hours"   />
            <span className="text-2xl font-bold text-muted-foreground">:</span>
            <CountdownUnit value={countdown.minutes} label="Minutes" />
            <span className="text-2xl font-bold text-muted-foreground">:</span>
            <CountdownUnit value={countdown.seconds} label="Seconds" />
          </div>

          <p className="text-xs text-muted-foreground">
            Every mock you attempt now is one step closer. Keep going.
          </p>
        </div>

      </div>

    </div>
  )
}