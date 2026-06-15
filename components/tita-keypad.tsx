"use client"

import { cn } from "@/lib/utils"

interface TitaKeypadProps {
  value: string
  onChange: (value: string) => void
}

export function TitaKeypad({ value, onChange }: TitaKeypadProps) {
  const handleKey = (key: string) => {
    if (key === "CLEAR") {
      onChange("")
      return
    }
    if (key === "BACKSPACE") {
      onChange(value.slice(0, -1))
      return
    }
    // Only allow one decimal point
    if (key === "." && value.includes(".")) return
    // Max 10 characters
    if (value.length >= 10) return
    onChange(value + key)
  }

  const keys = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["CLEAR", "0", "."],
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Display */}
      <div className="flex h-12 w-full max-w-xs items-center rounded-lg border border-input bg-background px-4 text-base font-mono text-foreground select-none">
        {value || <span className="text-muted-foreground">Type your answer</span>}
      </div>

      {/* Keypad */}
      <div className="flex w-full max-w-xs flex-col gap-2">
        {keys.map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-2">
            {row.map((key) => {
              const isClear     = key === "CLEAR"
              const isBackspace = key === "BACKSPACE"
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKey(key)}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-lg border text-sm font-semibold transition-colors select-none",
                    isClear
                      ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 col-span-1"
                      : "border-border bg-card text-foreground hover:bg-secondary hover:border-primary/40"
                  )}
                >
                  {key === "CLEAR" ? "Clear" : key}
                </button>
              )
            })}
          </div>
        ))}

        {/* Backspace full width */}
        <button
          type="button"
          onClick={() => handleKey("BACKSPACE")}
          className="flex h-12 w-full items-center justify-center rounded-lg border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-secondary hover:border-primary/40 select-none"
        >
          ⌫ Backspace
        </button>
      </div>
    </div>
  )
}