-- Railway DB는 V1 도입 이전(name_ja/image_url 컬럼이 생기기 전) 상태에서
-- baseline-on-migrate로 V1이 "이미 적용됨" 처리되어, 실제로는 컬럼이 없어
-- Hibernate validate가 실패했음. 여기서 실제로 컬럼을 추가해 맞춤.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS name_ja character varying(255);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_url character varying(500);
