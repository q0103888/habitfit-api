-- 유산소 운동은 무게 x 횟수가 아니라 시간(분)이 기준이라 duration_min 컬럼을 추가하고,
-- 유산소 세트는 weight_kg/reps를 안 쓰므로 두 컬럼을 nullable로 완화함
ALTER TABLE workout_sets ALTER COLUMN weight_kg DROP NOT NULL;
ALTER TABLE workout_sets ALTER COLUMN reps DROP NOT NULL;
ALTER TABLE workout_sets ADD COLUMN duration_min INTEGER;
