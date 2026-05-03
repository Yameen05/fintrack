package com.fintrack.dto;

import com.fintrack.entity.Transaction.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TransactionDto {

    @Data
    public static class Request {
        @NotBlank(message = "Description is required")
        private String description;

        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        private BigDecimal amount;

        @NotNull(message = "Type is required (INCOME or EXPENSE)")
        private TransactionType type;

        @NotBlank(message = "Category is required")
        private String category;

        @NotNull(message = "Date is required")
        private LocalDate date;

        private String notes;
    }

    @Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    @lombok.Builder
    public static class Response {
        private Long id;
        private String description;
        private BigDecimal amount;
        private TransactionType type;
        private String category;
        private LocalDate date;
        private String notes;
        private LocalDateTime createdAt;
    }
}
