
export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
  Savings = 'savings',
  Investment = 'investment',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  category: string;
  tags: string[];
  notes?: string;
}

export interface Investment {
    id: string;
    name: string;
    ticker: string;
    purchaseDate: string; // ISO String
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
}

export interface Budget {
    id: string;
    category: string;
    amount: number;
    period: 'monthly'; // Can be extended later
}

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
}

export enum Frequency {
    Daily = 'daily',
    Weekly = 'weekly',
    Monthly = 'monthly',
}

export interface RecurringTransaction {
    id: string;
    baseTransaction: Omit<Transaction, 'id' | 'date'>;
    frequency: Frequency;
    startDate: string; // ISO string
    nextDueDate: string; // ISO string
    endDate?: string; // ISO string
}
