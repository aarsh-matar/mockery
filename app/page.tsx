"use client"

import { useState, useEffect, useRef } from "react"
import { GraduationCap, Moon, Sun, LogOut, User } from "lucide-react"
import { DashboardView } from "@/components/dashboard-view"
import { MockLibraryView } from "@/components/mock-library-view"
import { AnalyticsView } from "@/components/analytics-view"
import { QuestionReviewView } from "@/components/question-review-view"
import { AuthView } from "@/components/auth-view"
import { createClient } from "@/lib/supabase/client"
import type { TestResult } from "@/lib/types"

type View = "dashboard" | "library" | "analytics" | "review"

interface UserProfile {
  name: string
  username: string
  id: string
}

export default function Page() {
  const [view, setView]               = useState<View>("dashboard")
  const [activeTest, setActiveTest]   = useState<string>("Mock-1")
  const [testResult, setTestResult]   = useState<TestResult | null>(null)
  const [allResults, setAllResults]   = useState<Record<string, TestResult>>({})
  const [dark, setDark]               = useState(false)
  const [user, setUser]               = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Loading bar
  const [progress, setProgress] = useState(0)
  const [barState, setBarState] = useState<"hidden"|"running"|"finishing"|"fading">("hidden")
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fadeTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supabase = createClient()

  // ── Dark mode ────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark") { setDark(true); document.documentElement.classList.add("dark") }
  }, [])

  useEffect(() => {
    if (dark) { document.documentElement.classList.add("dark");    localStorage.setItem("theme", "dark") }
    else      { document.documentElement.classList.remove("dark"); localStorage.setItem("theme", "light") }
  }, [dark])

  // ── Load past results from Supabase ─────────────────────────
  const loadResults = async (userId: string) => {
    const { data, error } = await supabase
      .from("test_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error || !data) return

    // Build allResults — keep only the latest result per testId
    const results: Record<string, TestResult> = {}
    for (const row of data) {
      if (!results[row.test_id]) {
        results[row.test_id] = {
          testId: row.test_id,
          totalScore: row.total_score,
          maxScore: row.max_score,
          sections: row.sections,
        }
      }
    }
    setAllResults(results)
  }

  // ── Save result to Supabase ──────────────────────────────────
  const saveResult = async (userId: string, result: TestResult) => {
    await supabase.from("test_results").insert({
      user_id:     userId,
      test_id:     result.testId,
      total_score: result.totalScore,
      max_score:   result.maxScore,
      sections:    result.sections,
    })
  }

  // ── Check existing session on load ───────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, username")
          .eq("id", session.user.id)
          .single()
        const userProfile = {
          name:     profile?.name ?? "Student",
          username: profile?.username ?? "",
          id:       session.user.id,
        }
        setUser(userProfile)
        await loadResults(session.user.id)
      }
      setAuthLoading(false)
    })
  }, [])

  // ── Loading bar ──────────────────────────────────────────────
  const navigateTo = (next: View) => {
    if (finishTimer.current) clearTimeout(finishTimer.current)
    if (fadeTimer.current)   clearTimeout(fadeTimer.current)
    setProgress(0)
    setBarState("running")
    requestAnimationFrame(() => requestAnimationFrame(() => setProgress(75)))
    finishTimer.current = setTimeout(() => {
      setView(next)
      setProgress(100)
      setBarState("finishing")
      fadeTimer.current = setTimeout(() => {
        setBarState("fading")
        setTimeout(() => { setBarState("hidden"); setProgress(0) }, 400)
      }, 300)
    }, 400)
  }

  // ── TEST_COMPLETE from mock tab ──────────────────────────────
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "TEST_COMPLETE") {
        const { testId, result } = e.data
        setActiveTest(testId)
        setTestResult(result)
        setAllResults(prev => ({ ...prev, [testId]: result }))
        // Save to Supabase if logged in
        if (user?.id) {
          saveResult(user.id, result)
        }
        navigateTo("analytics")
        window.focus()
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [user])

  const startTest = (testId: string) => {
    if (!user) {
      navigateTo("dashboard")
      return
    }
    setActiveTest(testId)
    window.open(`/mock/${testId}`, "_blank")
  }

  const handleViewAnalysis = (testId: string) => {
    const result = allResults[testId]
    if (!result) return
    setActiveTest(testId)
    setTestResult(result)
    navigateTo("analytics")
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAllResults({})
    setView("dashboard")
  }

  const handleAuth = async (profile: UserProfile) => {
    setUser(profile)
    await loadResults(profile.id)
  }

  // ── Loading state ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <span key={i} className="block size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Not logged in ─────────────────────────────────────────────
  if (!user) {
    return (
      <div className="relative">
        <button
          onClick={() => setDark(d => !d)}
          aria-label="Toggle dark mode"
          className="fixed right-4 top-4 z-50 flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <AuthView onAuth={handleAuth} />
      </div>
    )
  }

  // ── Logged in ─────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background px-6 py-6 md:px-10 md:py-10">

      {/* Loading bar */}
      {barState !== "hidden" && (
        <div
          className="fixed left-0 top-0 z-50 h-[3px]"
          style={{
            width: `${progress}%`,
            opacity: barState === "fading" ? 0 : 1,
            background: "oklch(0.7 0.18 180)",
            boxShadow: "0 0 8px 2px oklch(0.7 0.18 180 / 0.8), 0 0 16px 4px oklch(0.7 0.18 180 / 0.4)",
            transition: barState === "running"
              ? "width 0.45s cubic-bezier(0.1, 0.6, 0.4, 1)"
              : barState === "finishing"
              ? "width 0.25s ease-out"
              : "opacity 0.4s ease-out",
          }}
        />
      )}

      {/* Header */}
      <div className="mx-auto mb-10 flex w-full max-w-4xl items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold tracking-tight text-foreground">Mockery</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
            <User className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{user.username}</span>
          </div>
          <button
            onClick={() => setDark(d => !d)}
            aria-label="Toggle dark mode"
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>

      {/* Views */}
      <div key={view} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {view === "dashboard" && (
          <DashboardView
            onGoToMockTests={() => navigateTo("library")}
            userName={user.username}
            mocksAttempted={Object.keys(allResults).length}
            avgScore={
              Object.keys(allResults).length === 0
                ? null
                : Math.round(
                    Object.values(allResults).reduce((sum, r) => sum + r.totalScore, 0) /
                    Object.keys(allResults).length
                  )
            }
            hoursPracticed={Object.keys(allResults).length * 2}
          />
        )}
        {view === "library" && (
          <MockLibraryView
            onBack={() => navigateTo("dashboard")}
            onStartTest={startTest}
            onViewAnalysis={handleViewAnalysis}
            results={allResults}
          />
        )}
        {view === "analytics" && testResult && (
          <AnalyticsView
            result={testResult}
            onViewSolutions={() => navigateTo("review")}
            onBackToLibrary={() => navigateTo("library")}
          />
        )}
        {view === "review" && testResult && (
          <QuestionReviewView result={testResult} onBackToAnalytics={() => navigateTo("analytics")} />
        )}
      </div>
    </main>
  )
}