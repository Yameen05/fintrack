export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Budget {
  id: number;
  category: string;
  limitAmount: number;
  spentAmount: number;
  remaining: number;
  percentageUsed: number;
  month: number;
  year: number;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  expensesByCategory: Record<string, number>;
  budgets: Budget[];
}

export interface User {
  userId: number;
  name: string;
  email: string;
  token: string;
}

export const CATEGORIES = [
  'Food', 'Housing', 'Transport', 'Entertainment',
  'Healthcare', 'Shopping', 'Utilities', 'Education',
  'Savings', 'Salary', 'Freelance', 'Other'
];
