-- 1. profiles 테이블 생성
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text,
  fullname text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. RLS 활성화 (보안)
alter table public.profiles enable row level security;

-- 3. 정책: 누구나 프로필 조회 가능
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- 4. 정책: 본인 프로필만 수정 가능
create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. 회원가입 시 자동으로 profiles 행 생성
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

