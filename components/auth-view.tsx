"use client"

import { useState, useCallback } from "react"
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface AuthViewProps {
  onAuth: (user: { name: string; username: string; id: string }) => void
}

type Mode = "signin" | "signup"

// We auto-generate an email from username so Supabase Auth is happy
// Student never sees this — they only use username + password
const fakeEmail = (username: string) => `${username.toLowerCase().trim()}@mockery.app`

export function AuthView({ onAuth }: AuthViewProps) {
  const [mode, setMode]         = useState<Mode>("signin")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)

  // Sign up fields
  const [name, setName]         = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  // Sign in fields
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPass, setLoginPass]         = useState("")

  // createClient is called once outside render — fixes the re-render input bug
  const supabase = createClient()

  const handleSignUp = useCallback(async () => {
    setError(null)
    if (!name.trim() || !username.trim() || !password) {
      setError("Name, username, and password are required.")
      return
    }
    if (username.includes(" ")) {
      setError("Username cannot contain spaces.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    try {
      // Check username isn't taken
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase().trim())
        .maybeSingle()

      if (existing) {
        setError("That username is already taken. Try another one.")
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email:    fakeEmail(username),
        password,
        options: {
          data: {
            name:     name.trim(),
            username: username.toLowerCase().trim(),
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        onAuth({
          name:     name.trim(),
          username: username.toLowerCase().trim(),
          id:       data.user.id,
        })
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [name, username, password, supabase, onAuth])

  const handleSignIn = useCallback(async () => {
    setError(null)
    if (!loginUsername.trim() || !loginPass) {
      setError("Please enter your username and password.")
      return
    }
    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email:    fakeEmail(loginUsername),
        password: loginPass,
      })

      if (signInError) {
        setError("Incorrect username or password.")
        return
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, username")
          .eq("id", data.user.id)
          .single()

          onAuth({
            name:     profile?.name     ?? "Student",
            username: profile?.username ?? loginUsername,
            id:       data.user.id,
          })
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }, [loginUsername, loginPass, supabase, onAuth])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mockery</h1>
            <p className="text-sm text-muted-foreground">IPMAT Mock Test Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* Tabs */}
          <div className="mb-6 flex rounded-xl border border-border bg-muted p-1">
            {(["signin", "signup"] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null) }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Sign Up */}
          {mode === "signup" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Full Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Username <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="choose_a_username"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Password <span className="text-destructive">*</span></label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="h-11 w-full rounded-xl border border-input bg-background px-4 pr-11 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Create Account
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => { setMode("signin"); setError(null) }} className="font-semibold text-primary hover:underline">
                  Sign in
                </button>
              </p>
            </div>
          )}

          {/* Sign In */}
          {mode === "signin" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Username <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="your_username"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Password <span className="text-destructive">*</span></label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={loginPass}
                    onChange={e => setLoginPass(e.target.value)}
                    placeholder="Your password"
                    className="h-11 w-full rounded-xl border border-input bg-background px-4 pr-11 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Sign In
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => { setMode("signup"); setError(null) }} className="font-semibold text-primary hover:underline">
                  Sign up
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

```