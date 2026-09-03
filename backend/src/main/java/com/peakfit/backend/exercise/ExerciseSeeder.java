package com.peakfit.backend.exercise;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

// 앱 시작할 때 exercises 테이블에 아래 목록 중 아직 없는 것만 채워 넣음.
// count()==0일 때만 넣는 방식이 아니라 (bodyPart, name) 조합으로 중복 체크해서,
// 나중에 이 목록에 운동을 추가해도 재시작하면 새로 늘어난 것만 반영됨.
// name(한글)은 루틴/템플릿/통계가 매칭 키로 쓰는 불변값이라 그대로 두고, nameJa만 화면 표시 번역으로 씀
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
                        new Exercise("CHEST", "벤치프레스", "ベンチプレス"),
                        new Exercise("CHEST", "인클라인 벤치프레스", "インクラインベンチプレス"),
                        new Exercise("CHEST", "디클라인 벤치프레스", "デクラインベンチプレス"),
                        new Exercise("CHEST", "스미스 머신 벤치프레스", "スミスマシンベンチプレス"),
                        new Exercise("CHEST", "덤벨 플라이", "ダンベルフライ"),
                        new Exercise("CHEST", "펙덱 플라이", "ペックデックフライ"),
                        new Exercise("CHEST", "케이블 크로스오버", "ケーブルクロスオーバー"),
                        new Exercise("CHEST", "체스트프레스 머신", "チェストプレスマシン"),
                        new Exercise("CHEST", "딥스", "ディップス"),
                        new Exercise("CHEST", "푸시업", "プッシュアップ"),
                        new Exercise("BACK", "랫풀다운", "ラットプルダウン"),
                        new Exercise("BACK", "언더핸드 랫풀다운", "アンダーハンドラットプルダウン"),
                        new Exercise("BACK", "데드리프트", "デッドリフト"),
                        new Exercise("BACK", "바벨로우", "バーベルロウ"),
                        new Exercise("BACK", "시티드 케이블로우", "シーテッドケーブルロウ"),
                        new Exercise("BACK", "풀업", "懸垂"),
                        new Exercise("BACK", "원암 덤벨로우", "ワンアームダンベルロウ"),
                        new Exercise("BACK", "티바로우", "Tバーロウ"),
                        new Exercise("BACK", "백 익스텐션", "バックエクステンション"),
                        new Exercise("BACK", "슈러그", "シュラッグ"),
                        new Exercise("SHOULDER", "밀리터리프레스", "ミリタリープレス"),
                        new Exercise("SHOULDER", "사이드 레터럴 레이즈", "サイドレイズ"),
                        new Exercise("SHOULDER", "케이블 레터럴 레이즈", "ケーブルサイドレイズ"),
                        new Exercise("SHOULDER", "프론트 레이즈", "フロントレイズ"),
                        new Exercise("SHOULDER", "리어 델트 플라이", "リアデルトフライ"),
                        new Exercise("SHOULDER", "페이스풀", "フェイスプル"),
                        new Exercise("SHOULDER", "아놀드 프레스", "アーノルドプレス"),
                        new Exercise("SHOULDER", "시티드 덤벨프레스", "シーテッドダンベルプレス"),
                        new Exercise("SHOULDER", "스미스 머신 숄더프레스", "スミスマシンショルダープレス"),
                        new Exercise("SHOULDER", "업라이트로우", "アップライトロウ"),
                        new Exercise("LEG", "스쿼트", "スクワット"),
                        new Exercise("LEG", "레그프레스", "レッグプレス"),
                        new Exercise("LEG", "런지", "ランジ"),
                        new Exercise("LEG", "불가리안 스플릿 스쿼트", "ブルガリアンスプリットスクワット"),
                        new Exercise("LEG", "힙쓰러스트", "ヒップスラスト"),
                        new Exercise("LEG", "레그컬", "レッグカール"),
                        new Exercise("LEG", "시티드 레그컬", "シーテッドレッグカール"),
                        new Exercise("LEG", "레그익스텐션", "レッグエクステンション"),
                        new Exercise("LEG", "루마니안 데드리프트", "ルーマニアンデッドリフト"),
                        new Exercise("LEG", "카프레이즈", "カーフレイズ"),
                        new Exercise("ARM_ABS", "덤벨컬", "ダンベルカール"),
                        new Exercise("ARM_ABS", "바벨컬", "バーベルカール"),
                        new Exercise("ARM_ABS", "이지바 컬", "イージーバーカール"),
                        new Exercise("ARM_ABS", "케이블 컬", "ケーブルカール"),
                        new Exercise("ARM_ABS", "트라이셉스 익스텐션", "トライセップスエクステンション"),
                        new Exercise("ARM_ABS", "스컬크러셔", "スカルクラッシャー"),
                        new Exercise("ARM_ABS", "케이블 푸시다운", "ケーブルプッシュダウン"),
                        new Exercise("ARM_ABS", "행잉 레그레이즈", "ハンギングレッグレイズ"),
                        new Exercise("ARM_ABS", "크런치", "クランチ"),
                        new Exercise("ARM_ABS", "플랭크", "プランク"),
                        new Exercise("CARDIO", "러닝머신", "トレッドミル"),
                        new Exercise("CARDIO", "실외 러닝", "屋外ランニング"),
                        new Exercise("CARDIO", "사이클", "エアロバイク"),
                        new Exercise("CARDIO", "로잉머신", "ローイングマシン"),
                        new Exercise("CARDIO", "일립티컬", "エリプティカル"),
                        new Exercise("CARDIO", "계단 오르기", "階段昇降"),
                        new Exercise("CARDIO", "줄넘기", "縄跳び"),
                        new Exercise("CARDIO", "버피", "バーピー"),
                        new Exercise("CARDIO", "수영", "水泳"),
                        new Exercise("CARDIO", "등산", "登山"));

        Map<String, Exercise> existing =
                exerciseRepository.findAll().stream()
                        .collect(Collectors.toMap(e -> e.getBodyPart() + "|" + e.getName(), e -> e));

        List<Exercise> toAdd = seed.stream().filter(e -> !existing.containsKey(e.getBodyPart() + "|" + e.getName())).toList();
        if (!toAdd.isEmpty()) {
            exerciseRepository.saveAll(toAdd);
            // existing은 이 메서드 맨 위에서 찍은 스냅샷이라, 방금 새로 넣은 것들도 반영해둬야
            // 아래 seedFromCatalogFile()이 "완전히 새로 시작하는 DB"에서 이걸 중복으로 다시 넣지 않음
            toAdd.forEach(e -> existing.put(e.getBodyPart() + "|" + e.getName(), e));
        }

        // 이미 심어져 있던(nameJa 컬럼 추가 이전) 기존 로우는 번역이 비어있으므로 백필
        List<Exercise> toBackfill =
                seed.stream()
                        .map(e -> existing.get(e.getBodyPart() + "|" + e.getName()))
                        .filter(e -> e != null && e.getNameJa() == null)
                        .toList();
        for (Exercise e : toBackfill) {
            String nameJa =
                    seed.stream()
                            .filter(s -> s.getBodyPart().equals(e.getBodyPart()) && s.getName().equals(e.getName()))
                            .findFirst()
                            .map(Exercise::getNameJa)
                            .orElse(null);
            e.setNameJa(nameJa);
        }
        if (!toBackfill.isEmpty()) {
            exerciseRepository.saveAll(toBackfill);
        }

        seedFromCatalogFile(existing);
    }

    // resources/exercises-catalog.json — free-exercise-db(퍼블릭 도메인) 기반으로 만든 확장 카탈로그.
    // 이미 있는 (부위,이름)이면 null인 필드만 채워주고(예: 기존 60개의 imageUrl 백필),
    // 없으면 새 운동으로 추가함. 나중에 운동을 더 늘리고 싶으면 이 파일에 항목만 추가하면 됨
    private void seedFromCatalogFile(Map<String, Exercise> existing) {
        List<CatalogEntry> catalog;
        try (InputStream in = new ClassPathResource("exercises-catalog.json").getInputStream()) {
            catalog = new ObjectMapper().readValue(in, new TypeReference<>() {});
        } catch (IOException e) {
            throw new IllegalStateException("exercises-catalog.json을 읽을 수 없습니다.", e);
        }

        List<Exercise> toInsert = new ArrayList<>();
        List<Exercise> toPatch = new ArrayList<>();
        for (CatalogEntry entry : catalog) {
            String key = entry.bodyPart() + "|" + entry.name();
            Exercise found = existing.get(key);
            if (found == null) {
                Exercise fresh = new Exercise(entry.bodyPart(), entry.name(), entry.nameJa());
                fresh.setImageUrl(entry.imageUrl());
                toInsert.add(fresh);
                existing.put(key, fresh);
            } else {
                boolean changed = false;
                if (found.getNameJa() == null && entry.nameJa() != null) {
                    found.setNameJa(entry.nameJa());
                    changed = true;
                }
                if (found.getImageUrl() == null && entry.imageUrl() != null) {
                    found.setImageUrl(entry.imageUrl());
                    changed = true;
                }
                if (changed) {
                    toPatch.add(found);
                }
            }
        }
        if (!toInsert.isEmpty()) {
            exerciseRepository.saveAll(toInsert);
        }
        if (!toPatch.isEmpty()) {
            exerciseRepository.saveAll(toPatch);
        }
    }

    private record CatalogEntry(String bodyPart, String name, String nameJa, String imageUrl) {}
}
