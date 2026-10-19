# Supabase export helper

This script exports the SERC Supabase tables to JSON files under the repository `data/` directory.

Files created:
- data/users.json
- data/user_links.json
- data/players.json
- data/player_profile.json
- data/player_guardians.json
- data/player_stats.json
- data/player_metrics.json
- data/matches.json
- data/match_details.json
- data/match_stats.json
- data/trainings.json
- data/training_details.json
- data/fees.json
- data/events.json
- data/announcements.json

How to run
1. Install dependencies:

   npm install

2. Create a `.env` file in the repo root with your Supabase connection (or set env vars in your shell):

   SUPABASE_URL=https://mtopqypcrmzihmfueujy.supabase.co
   SUPABASE_ANON_KEY=public:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10b3BxeXBjcm16aWhtZnVldWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDQ2OTMsImV4cCI6MjEwNzU4MDY5M30.oocXGBr6pBA7GS1KjOhWIPejHausQ3k9UgRxKQ0fgh4

Note: Do NOT commit your `.env` to source control if it contains secrets. The anon key is public-facing but still sensitive in some contexts.

3. Run the export:

   npm run export:supabase

The script will write JSON files into `data/` with the exported table rows.

If any table is protected by RLS or requires authenticated access, make sure the anon key used has the needed permissions (or run with a service_role key in a secure environment).
