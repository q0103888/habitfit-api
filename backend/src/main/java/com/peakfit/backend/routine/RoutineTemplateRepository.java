package com.peakfit.backend.routine;

import com.peakfit.backend.user.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineTemplateRepository extends JpaRepository<RoutineTemplate, Long> {

    List<RoutineTemplate> findByUser(User user);
}
