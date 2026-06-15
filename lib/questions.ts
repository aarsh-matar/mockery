import { createClient } from './supabase/client'

export type Question = {
  id: string
  mock_id: string
  section: string
  question_no: number
  question_type: string
  question_text: string
  passage_key: string | null
  passage_text: string | null
  di_data_key: string | null
  di_data_html: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string | null
  explanation: string | null
  difficulty: string | null
}

export async function fetchMockQuestions(mockId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('mock_id', mockId)
    .order('section', { ascending: true })
    .order('question_no', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Question[]
}