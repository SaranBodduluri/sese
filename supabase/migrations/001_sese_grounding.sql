-- Sese: textbook storage + pgvector retrieval + lightweight session persistence.
--
-- REQUIRED: Run this entire file in the Supabase Dashboard → SQL → New query → Run.
-- If you see "Could not find the table 'public.sese_documents' in the schema cache",
-- the tables were never created here, or PostgREST needs a reload (last line below).
--
-- If the HNSW index line fails on your project, comment it out and use the IVFFLAT
-- block at the bottom instead, then re-run.

create extension if not exists vector;

-- --- Textbook corpus ---------------------------------------------------------

create table if not exists public.sese_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.sese_document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.sese_documents (id) on delete cascade,
  chunk_index int not null,
  section_label text,
  content text not null,
  embedding vector (768) not null
);

create index if not exists sese_document_chunks_document_id_idx on public.sese_document_chunks (document_id);

create index if not exists sese_document_chunks_embedding_hnsw
  on public.sese_document_chunks
  using hnsw (embedding vector_cosine_ops);

-- If HNSW creation fails (rare on older pgvector), drop the line above and use instead:
-- create index if not exists sese_document_chunks_embedding_ivf
--   on public.sese_document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Semantic search: returns cosine similarity as 1 - distance.
create or replace function public.match_sese_document_chunks (
  query_embedding vector (768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  document_id uuid,
  title text,
  content text,
  section_label text,
  chunk_index int,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.document_id,
    d.title,
    c.content,
    c.section_label,
    c.chunk_index,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  from public.sese_document_chunks c
  join public.sese_documents d on d.id = c.document_id
  where (1 - (c.embedding <=> query_embedding)) >= match_threshold
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

-- --- Study session persistence (optional; used when service role is configured) -

create table if not exists public.sese_study_sessions (
  id uuid primary key default gen_random_uuid(),
  client_session_id text not null unique,
  user_id text,
  profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sese_session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sese_study_sessions (id) on delete cascade,
  role text not null,
  content text,
  tutor_feedback jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sese_session_messages_session_id_idx on public.sese_session_messages (session_id);

create table if not exists public.sese_board_states (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sese_study_sessions (id) on delete cascade,
  board jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists sese_board_states_session_id_idx on public.sese_board_states (session_id);

-- Refresh PostgREST so the REST API sees new tables (fixes "schema cache" errors after first deploy).
notify pgrst, 'reload schema';
