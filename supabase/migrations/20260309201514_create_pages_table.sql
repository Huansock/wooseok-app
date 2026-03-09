create table public.pages (
    id uuid primary key default gen_random_uuid(),
    author_id uuid references auth.users(id) on delete cascade,
    book_id uuid references public.books(id) on delete cascade,
    md_text text,
    created_at timestamptz default now()
);

alter table public.pages enable row level security;

-- 누구나 페이지 조회 가능
create policy "pages are viewable by everyone"
    on public.pages for select
    using (true);

-- 본인만 페이지 작성 가능
create policy "users can insert own pages"
    on public.pages for insert
    with check (auth.uid() = author_id);

-- 본인만 페이지 수정 가능
create policy "users can update own pages"
    on public.pages for update
    using (auth.uid() = author_id);

-- 본인만 페이지 삭제 가능
create policy "users can delete own pages"
    on public.pages for delete
    using (auth.uid() = author_id);
