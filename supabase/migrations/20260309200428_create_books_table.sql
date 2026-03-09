create table public.books (
    id uuid primary key default gen_random_uuid(),
    author_id uuid references auth.users(id) on delete cascade,
    title text,
    created_at timestamptz default now()
);

alter table public.books enable row level security;

-- 누구나 글 조회 가능
create policy "books are viewable by everyone"
    on public.books for select
    using (true);

-- 본인만 글 작성 가능
-- UPDATE 정책은 using, INSERT 정책은 with check를 씁니다.
-- using은 "어떤 행에 접근할 수 있는가", with check는 "새로 삽입/수정되는 데이터가 조건을 만족하는가" 입니다.
create policy "users can insert own books"
    on public.books for insert
    with check (auth.uid() = author_id);

-- 본인만 글 수정 가능
create policy "users can update own books"
    on public.books for update
    using (auth.uid() = author_id);

-- 본인만 글 삭제 가능
create policy "users can delete own books"
    on public.books for delete
    using (auth.uid() = author_id);
