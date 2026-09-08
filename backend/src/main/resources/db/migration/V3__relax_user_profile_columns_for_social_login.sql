-- 구글 로그인으로 가입하는 유저는 생년월일/국적 정보를 안 줘서 NOT NULL이면 가입이 막힘.
-- 이 두 컬럼은 다른 어떤 비즈니스 로직에도 쓰이지 않는 프로필용 메타데이터라 완화해도 안전함.
ALTER TABLE users ALTER COLUMN birth_date DROP NOT NULL;
ALTER TABLE users ALTER COLUMN nationality DROP NOT NULL;
