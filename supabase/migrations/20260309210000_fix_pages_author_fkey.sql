-- pages.author_id가 auth.users를 참조하고 있지만,
-- PostgREST 자동 조인을 위해 profiles를 직접 참조하는 FK를 추가
ALTER TABLE public.pages
    DROP CONSTRAINT IF EXISTS pages_author_id_fkey,
    ADD CONSTRAINT pages_author_id_fkey
        FOREIGN KEY (author_id)
        REFERENCES public.profiles(id)
        ON DELETE CASCADE;
