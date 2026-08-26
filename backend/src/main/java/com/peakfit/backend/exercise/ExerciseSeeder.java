package com.peakfit.backend.exercise;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

// 앱 시작할 때 exercises 테이블에 아래 목록 중 아직 없는 것만 채워 넣음.
// count()==0일 때만 넣는 방식이 아니라 (bodyPart, name) 조합으로 중복 체크해서,
// 나중에 이 목록에 운동을 추가해도 재시작하면 새로 늘어난 것만 반영됨
@Component
public class ExerciseSeeder implements CommandLineRunner {

    private final ExerciseRepository exerciseRepository;

    public ExerciseSeeder(ExerciseRepository exerciseRepository) {
        this.exerciseRepository = exerciseRepository;
    }

    @Override
    public void run(String... args) {
        List<Exercise> seed =
                List.of(
                        new Exercise("CHEST", "벤치프레스"),
                        new Exercise("CHEST", "인클라인 벤치프레스"),
                        new Exercise("CHEST", "디클라인 벤치프레스"),
                        new Exercise("CHEST", "스미스 머신 벤치프레스"),
                        new Exercise("CHEST", "덤벨 플라이"),
                        new Exercise("CHEST", "펙덱 플라이"),
                        new Exercise("CHEST", "케이블 크로스오버"),
                        new Exercise("CHEST", "체스트프레스 머신"),
                        new Exercise("CHEST", "딥스"),
                        new Exercise("CHEST", "푸시업"),
                        new Exercise("BACK", "랫풀다운"),
                        new Exercise("BACK", "언더핸드 랫풀다운"),
                        new Exercise("BACK", "데드리프트"),
                        new Exercise("BACK", "바벨로우"),
                        new Exercise("BACK", "시티드 케이블로우"),
                        new Exercise("BACK", "풀업"),
                        new Exercise("BACK", "원암 덤벨로우"),
                        new Exercise("BACK", "티바로우"),
                        new Exercise("BACK", "백 익스텐션"),
                        new Exercise("BACK", "슈러그"),
                        new Exercise("SHOULDER", "밀리터리프레스"),
                        new Exercise("SHOULDER", "사이드 레터럴 레이즈"),
                        new Exercise("SHOULDER", "케이블 레터럴 레이즈"),
                        new Exercise("SHOULDER", "프론트 레이즈"),
                        new Exercise("SHOULDER", "리어 델트 플라이"),
                        new Exercise("SHOULDER", "페이스풀"),
                        new Exercise("SHOULDER", "아놀드 프레스"),
                        new Exercise("SHOULDER", "시티드 덤벨프레스"),
                        new Exercise("SHOULDER", "스미스 머신 숄더프레스"),
                        new Exercise("SHOULDER", "업라이트로우"),
                        new Exercise("LEG", "스쿼트"),
                        new Exercise("LEG", "레그프레스"),
                        new Exercise("LEG", "런지"),
                        new Exercise("LEG", "불가리안 스플릿 스쿼트"),
                        new Exercise("LEG", "힙쓰러스트"),
                        new Exercise("LEG", "레그컬"),
                        new Exercise("LEG", "시티드 레그컬"),
                        new Exercise("LEG", "레그익스텐션"),
                        new Exercise("LEG", "루마니안 데드리프트"),
                        new Exercise("LEG", "카프레이즈"),
                        new Exercise("ARM_ABS", "덤벨컬"),
                        new Exercise("ARM_ABS", "바벨컬"),
                        new Exercise("ARM_ABS", "이지바 컬"),
                        new Exercise("ARM_ABS", "케이블 컬"),
                        new Exercise("ARM_ABS", "트라이셉스 익스텐션"),
                        new Exercise("ARM_ABS", "스컬크러셔"),
                        new Exercise("ARM_ABS", "케이블 푸시다운"),
                        new Exercise("ARM_ABS", "행잉 레그레이즈"),
                        new Exercise("ARM_ABS", "크런치"),
                        new Exercise("ARM_ABS", "플랭크"),
                        new Exercise("CARDIO", "러닝머신"),
                        new Exercise("CARDIO", "실외 러닝"),
                        new Exercise("CARDIO", "사이클"),
                        new Exercise("CARDIO", "로잉머신"),
                        new Exercise("CARDIO", "일립티컬"),
                        new Exercise("CARDIO", "계단 오르기"),
                        new Exercise("CARDIO", "줄넘기"),
                        new Exercise("CARDIO", "버피"),
                        new Exercise("CARDIO", "수영"),
                        new Exercise("CARDIO", "등산"));

        Set<String> existingKeys =
                exerciseRepository.findAll().stream()
                        .map(e -> e.getBodyPart() + "|" + e.getName())
                        .collect(Collectors.toSet());

        List<Exercise> toAdd =
                seed.stream().filter(e -> !existingKeys.contains(e.getBodyPart() + "|" + e.getName())).toList();

        if (!toAdd.isEmpty()) {
            exerciseRepository.saveAll(toAdd);
        }
    }
}
