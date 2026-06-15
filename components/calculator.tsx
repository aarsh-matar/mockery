"use client"

import { useState, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalculatorProps {
  onClose: () => void
}

export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay]     = useState("0")
  const [memory, setMemory]       = useState(0)
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [operator, setOperator]   = useState<string | null>(null)
  const [waitNext, setWaitNext]   = useState(false)

  const calc = (a: number, op: string, b: number): number => {
    switch (op) {
      case "+": return a + b
      case "-": return a - b
      case "*": return a * b
      case "/": return b !== 0 ? a / b : 0
      default:  return b
    }
  }

  const inputDigit = (d: string) => {
    if (waitNext) {
      setDisplay(d === "." ? "0." : d)
      setWaitNext(false)
    } else {
      if (d === "." && display.includes(".")) return
      setDisplay(display === "0" && d !== "." ? d : display + d)
    }
  }

  const inputOp = (op: string) => {
    const cur = parseFloat(display)
    if (prevValue !== null && !waitNext) {
      const result = calc(prevValue, operator!, cur)
      setDisplay(String(parseFloat(result.toFixed(10))))
      setPrevValue(result)
    } else {
      setPrevValue(cur)
    }
    setOperator(op)
    setWaitNext(true)
  }

  const equals = () => {
    if (prevValue === null || operator === null) return
    const cur    = parseFloat(display)
    const result = calc(prevValue, operator, cur)
    setDisplay(String(parseFloat(result.toFixed(10))))
    setPrevValue(null)
    setOperator(null)
    setWaitNext(true)
  }

  const clear = () => {
    setDisplay("0")
    setPrevValue(null)
    setOperator(null)
    setWaitNext(false)
  }

  const backspace = () => {
    if (waitNext) return
    const next = display.length > 1 ? display.slice(0, -1) : "0"
    setDisplay(next)
  }

  const toggleSign  = () => setDisplay(String(parseFloat(display) * -1))
  const percent     = () => setDisplay(String(parseFloat(display) / 100))
  const sqrt        = () => setDisplay(String(parseFloat(Math.sqrt(parseFloat(display)).toFixed(10))))
  const reciprocal  = () => { const v = parseFloat(display); setDisplay(v !== 0 ? String(1/v) : "Error") }

  const memClear  = () => setMemory(0)
  const memRecall = () => { setDisplay(String(memory)); setWaitNext(false) }
  const memStore  = () => setMemory(parseFloat(display))
  const memAdd    = () => setMemory(memory + parseFloat(display))
  const memSub    = () => setMemory(memory - parseFloat(display))

  const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-5 gap-1.5">{children}</div>
  )

  const Btn = ({
    label, onClick, variant = "default", wide = false
  }: {
    label: string
    onClick: () => void
    variant?: "default" | "op" | "eq" | "fn" | "mem" | "danger"
    wide?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-lg text-sm font-semibold transition-colors select-none h-10",
        wide && "col-span-2",
        variant === "default" && "bg-card border border-border text-foreground hover:bg-secondary",
        variant === "op"      && "bg-secondary border border-border text-primary hover:bg-primary/10",
        variant === "eq"      && "bg-primary text-primary-foreground hover:opacity-90 row-span-2 h-full",
        variant === "fn"      && "bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20",
        variant === "mem"     && "bg-muted border border-border text-muted-foreground hover:bg-secondary text-xs",
        variant === "danger"  && "bg-destructive text-white hover:opacity-90",
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="fixed right-4 top-20 z-50 w-72 rounded-2xl border border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-primary px-4 py-2.5">
        <span className="text-sm font-semibold text-primary-foreground">Calculator</span>
        <button type="button" onClick={onClose} className="text-primary-foreground/70 hover:text-primary-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {/* Display */}
        <div className="flex min-h-14 flex-col items-end justify-end rounded-xl bg-muted px-4 py-2">
          {operator && prevValue !== null && (
            <span className="text-xs text-muted-foreground">{prevValue} {operator}</span>
          )}
          <span className="text-2xl font-mono font-semibold text-foreground break-all text-right">
            {display}
          </span>
        </div>

        {/* Memory row */}
        <div className="grid grid-cols-5 gap-1.5">
          <Btn label="MC" onClick={memClear}  variant="mem" />
          <Btn label="MR" onClick={memRecall} variant="mem" />
          <Btn label="MS" onClick={memStore}  variant="mem" />
          <Btn label="M+" onClick={memAdd}    variant="mem" />
          <Btn label="M-" onClick={memSub}    variant="mem" />
        </div>

        {/* Function row */}
        <div className="grid grid-cols-5 gap-1.5">
          <Btn label="←"   onClick={backspace}   variant="danger" />
          <Btn label="C"    onClick={clear}       variant="danger" />
          <Btn label="+/-" onClick={toggleSign}  variant="fn" />
          <Btn label="√"   onClick={sqrt}        variant="fn" />
          <Btn label="%"   onClick={percent}     variant="fn" />
        </div>

        {/* Number grid with operators */}
        <div className="grid grid-cols-5 gap-1.5">
          {/* Row 1 */}
          <Btn label="7"   onClick={() => inputDigit("7")} />
          <Btn label="8"   onClick={() => inputDigit("8")} />
          <Btn label="9"   onClick={() => inputDigit("9")} />
          <Btn label="/"   onClick={() => inputOp("/")}  variant="op" />
          <Btn label="1/x" onClick={reciprocal}           variant="fn" />
          {/* Row 2 */}
          <Btn label="4"   onClick={() => inputDigit("4")} />
          <Btn label="5"   onClick={() => inputDigit("5")} />
          <Btn label="6"   onClick={() => inputDigit("6")} />
          <Btn label="*"   onClick={() => inputOp("*")}  variant="op" />
          {/* Equals spans rows 2-3 */}
          <button
            type="button"
            onClick={equals}
            className="row-span-2 flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold hover:opacity-90 select-none"
          >=</button>
          {/* Row 3 */}
          <Btn label="1"   onClick={() => inputDigit("1")} />
          <Btn label="2"   onClick={() => inputDigit("2")} />
          <Btn label="3"   onClick={() => inputDigit("3")} />
          <Btn label="-"   onClick={() => inputOp("-")}  variant="op" />
          {/* Row 4 */}
          <Btn label="0"   onClick={() => inputDigit("0")} wide />
          <Btn label="."   onClick={() => inputDigit(".")} />
          <Btn label="+"   onClick={() => inputOp("+")}  variant="op" />
        </div>
      </div>
    </div>
  )
}