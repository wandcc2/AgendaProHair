import { createClient } from '@supabase/supabase-js'

// Substitua pelas credenciais reais do seu projeto Supabase (Project Settings > API)
const SUPABASE_URL = 'https://ujdaesnmqhkzefqdwygk.supabase.co'
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_PUBLICA_AQUI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
