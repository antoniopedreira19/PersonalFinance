export type Transaction = {
  id: number;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
  date: string;
};

export type MonthlyData = {
  month: string;
  balance: number;
  income: number;
  expenses: number;
};

export type Category = {
  name: string;
  amount: number;
  percentage: number;
  color: string;
};

export const stats = {
  totalBalance: 24850.75,
  monthlyIncome: 8500.0,
  monthlyExpenses: 5230.4,
  savingsRate: 38.5,
};

export const transactions: Transaction[] = [
  { id: 1, description: "Salário", category: "Renda", amount: 8500, type: "income", date: "2024-03-05" },
  { id: 2, description: "Aluguel", category: "Moradia", amount: 1800, type: "expense", date: "2024-03-05" },
  { id: 3, description: "Supermercado", category: "Alimentação", amount: 450, type: "expense", date: "2024-03-04" },
  { id: 4, description: "Uber", category: "Transporte", amount: 38, type: "expense", date: "2024-03-04" },
  { id: 5, description: "Netflix", category: "Lazer", amount: 55, type: "expense", date: "2024-03-03" },
  { id: 6, description: "Freela Design", category: "Renda", amount: 1200, type: "income", date: "2024-03-03" },
  { id: 7, description: "Farmácia", category: "Saúde", amount: 127, type: "expense", date: "2024-03-02" },
  { id: 8, description: "Restaurante", category: "Alimentação", amount: 89, type: "expense", date: "2024-03-02" },
  { id: 9, description: "Conta de Luz", category: "Moradia", amount: 210, type: "expense", date: "2024-03-01" },
  { id: 10, description: "iFood", category: "Alimentação", amount: 72, type: "expense", date: "2024-03-01" },
  { id: 11, description: "Rendimento CDB", category: "Investimentos", amount: 320, type: "income", date: "2024-02-28" },
  { id: 12, description: "Academia", category: "Saúde", amount: 99, type: "expense", date: "2024-02-28" },
  { id: 13, description: "Spotify", category: "Lazer", amount: 21, type: "expense", date: "2024-02-27" },
  { id: 14, description: "Gasolina", category: "Transporte", amount: 180, type: "expense", date: "2024-02-27" },
  { id: 15, description: "Amazon Prime", category: "Lazer", amount: 19, type: "expense", date: "2024-02-26" },
];

export const monthlyData: MonthlyData[] = [
  { month: "Out", balance: 18200, income: 7800, expenses: 5100 },
  { month: "Nov", balance: 20350, income: 8200, expenses: 4800 },
  { month: "Dez", balance: 21100, income: 9100, expenses: 6200 },
  { month: "Jan", balance: 22400, income: 8500, expenses: 5900 },
  { month: "Fev", balance: 23600, income: 8300, expenses: 4750 },
  { month: "Mar", balance: 24850, income: 8500, expenses: 5230 },
];

export const categories: Category[] = [
  { name: "Moradia", amount: 2010, percentage: 38.4, color: "#3b82f6" },
  { name: "Alimentação", amount: 1011, percentage: 19.3, color: "#8b5cf6" },
  { name: "Transporte", amount: 380, percentage: 7.3, color: "#06b6d4" },
  { name: "Lazer", amount: 315, percentage: 6.0, color: "#f59e0b" },
  { name: "Saúde", amount: 226, percentage: 4.3, color: "#10b981" },
  { name: "Outros", amount: 1288, percentage: 24.6, color: "#6366f1" },
];
