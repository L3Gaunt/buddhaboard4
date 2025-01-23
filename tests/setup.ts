import { beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

beforeAll(async () => {
  // Verify environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }

  // Initialize Supabase client with service role key
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify database connection
  const { error } = await supabase.from('kb_articles').select('id').limit(1)
  if (error) {
    throw new Error(`Failed to connect to database: ${error.message}`)
  }
}) 