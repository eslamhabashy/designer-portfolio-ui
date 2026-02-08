import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
    console.log('Attempting to add is_hero column to projects table...')

    // We can't run arbitrary SQL via the standard client unless we have a specific function
    // But we can use the 'rpc' method if a function exists, or try to insert a record 
    // to see if it works. 

    // Since we don't have a 'db-exec' RPC, the best way to handle migrations is usually 
    // informing the user or using a migration tool. 

    // HOWEVER, for Supabase, if the user hasn't set up migrations, 
    // they should run this in the SQL Editor:
    // ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_hero BOOLEAN DEFAULT false;

    console.log('\n--- SQL COMMAND TO RUN ---')
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_hero BOOLEAN DEFAULT false;')
    console.log('--------------------------\n')

    // Let's try to update a project with is_hero: false to see if it exists
    const { error } = await supabase
        .from('projects')
        .select('is_hero')
        .limit(1)

    if (error && error.code === '42703') {
        console.error('Confirmed: is_hero column is missing.')
    } else if (error) {
        console.error('Error checking column:', error.message)
    } else {
        console.log('is_hero column already exists!')
    }
}

migrate()
