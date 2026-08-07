package com.peakfit.backend.auth;

import java.time.LocalDate;

public record MeResponse(
        String email, String lastName, String firstName, LocalDate birthDate, String nationality) {}
