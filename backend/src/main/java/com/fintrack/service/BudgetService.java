package com.fintrack.service;

import com.fintrack.dto.BudgetDto;
import com.fintrack.entity.Budget;
import com.fintrack.entity.Transaction;
import com.fintrack.entity.User;
import com.fintrack.repository.BudgetRepository;
import com.fintrack.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    public BudgetDto.Response createOrUpdate(BudgetDto.Request request, User user) {
        Budget budget = budgetRepository
                .findByUserIdAndCategoryAndMonthAndYear(
                        user.getId(), request.getCategory(), request.getMonth(), request.getYear())
                .orElse(Budget.builder().user(user).build());

        budget.setCategory(request.getCategory());
        budget.setLimitAmount(request.getLimitAmount());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        Budget saved = budgetRepository.save(budget);
        return toResponse(saved, user.getId());
    }

    public List<BudgetDto.Response> getByMonth(Long userId, int month, int year) {
        return budgetRepository.findByUserIdAndMonthAndYear(userId, month, year)
                .stream()
                .map(b -> toResponse(b, userId))
                .collect(Collectors.toList());
    }

    public BudgetDto.MonthlySummary getMonthlySummary(Long userId, int month, int year) {
        List<Transaction> transactions = transactionRepository.findByUserIdAndMonthAndYear(userId, month, year);

        BigDecimal totalIncome = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> expensesByCategory = transactions.stream()
                .filter(t -> t.getType() == Transaction.TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        Transaction::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        List<BudgetDto.Response> budgets = getByMonth(userId, month, year);

        return BudgetDto.MonthlySummary.builder()
                .month(month)
                .year(year)
                .totalIncome(totalIncome)
                .totalExpenses(totalExpenses)
                .netBalance(totalIncome.subtract(totalExpenses))
                .expensesByCategory(expensesByCategory)
                .budgets(budgets)
                .build();
    }

    public void delete(Long id, Long userId) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        if (!budget.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        budgetRepository.delete(budget);
    }

    private BudgetDto.Response toResponse(Budget budget, Long userId) {
        BigDecimal spent = transactionRepository.sumExpenseByCategory(
                userId, budget.getCategory(), budget.getMonth(), budget.getYear());

        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal remaining = budget.getLimitAmount().subtract(spent);
        double percentage = spent.divide(budget.getLimitAmount(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue();

        return BudgetDto.Response.builder()
                .id(budget.getId())
                .category(budget.getCategory())
                .limitAmount(budget.getLimitAmount())
                .spentAmount(spent)
                .remaining(remaining)
                .percentageUsed(percentage)
                .month(budget.getMonth())
                .year(budget.getYear())
                .build();
    }
}
