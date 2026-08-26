package com.peakfit.backend.exercise;

import org.springframework.data.jpa.repository.JpaRepository;

// 커스텀 조회 메서드 없이 JpaRepository 기본 CRUD(findAll, save, count 등)만 그대로 씀
public interface ExerciseRepository extends JpaRepository<Exercise, Long> {}
