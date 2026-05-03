package com.fintrack.service;

import com.fintrack.dto.TransactionDto;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.User;
import com.fintrack.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransactionService transactionService;

    private User testUser;
    private Transaction testTransaction;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Yameen")
                .email("yameen@test.com")
                .build();

        testTransaction = Transaction.builder()
                .id(1L)
                .description("Groceries")
                .amount(new BigDecimal("85.00"))
                .type(Transaction.TransactionType.EXPENSE)
                .category("Food")
                .date(LocalDate.now())
                .user(testUser)
                .build();
    }

    @Test
    void createTransaction_ShouldReturnResponse() {
        TransactionDto.Request request = new TransactionDto.Request();
        request.setDescription("Groceries");
        request.setAmount(new BigDecimal("85.00"));
        request.setType(Transaction.TransactionType.EXPENSE);
        request.setCategory("Food");
        request.setDate(LocalDate.now());

        when(transactionRepository.save(any(Transaction.class))).thenReturn(testTransaction);

        TransactionDto.Response response = transactionService.create(request, testUser);

        assertThat(response).isNotNull();
        assertThat(response.getDescription()).isEqualTo("Groceries");
        assertThat(response.getAmount()).isEqualByComparingTo("85.00");
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    void getAll_ShouldReturnTransactionList() {
        when(transactionRepository.findByUserIdOrderByDateDesc(1L))
                .thenReturn(List.of(testTransaction));

        List<TransactionDto.Response> result = transactionService.getAll(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo("Food");
    }

    @Test
    void delete_WithWrongUser_ShouldThrowException() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(testTransaction));

        assertThatThrownBy(() -> transactionService.delete(1L, 99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    @Test
    void delete_WithCorrectUser_ShouldSucceed() {
        when(transactionRepository.findById(1L)).thenReturn(Optional.of(testTransaction));

        transactionService.delete(1L, 1L);

        verify(transactionRepository, times(1)).delete(testTransaction);
    }
}
