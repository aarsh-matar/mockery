import type { Question } from "./questions"

export interface QuestionResult {
  question:      Question
  studentAnswer: string | null
  isCorrect:     boolean
  isSkipped:     boolean
  score:         number
}

export interface SectionResult {
  sectionId:  string
  questions:  QuestionResult[]
  correct:    number
  wrong:      number
  skipped:    number
  score:      number
  maxScore:   number
}

export interface TestResult {
  testId:      string
  sections:    SectionResult[]
  totalScore:  number
  maxScore:    number
}