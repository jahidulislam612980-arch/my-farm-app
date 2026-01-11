
export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  // Egg Records
  cratesProduced: number;
  eggPricePerPiece: number;
  // Feed Records
  feedBagsUsed: number;
  feedTotalCost: number;
  // Medicine Records
  medicineName: string;
  medicineCost: number;
  // Flock Stats
  totalChickens: number;
  layingChickens: number;
  nonLayingChickens: number;
}

export interface MonthlySummary {
  month: string; // e.g., "January 2023"
  totalEggProduction: number; // Total eggs (crates * eggs_per_crate, assuming 30 eggs/crate)
  totalEggRevenue: number;
  totalFeedExpenses: number;
  totalMedicineExpenses: number;
  totalExpenses: number;
  profitOrLoss: number;
}

export interface User {
  username: string;
}

export enum NavSection {
  DAILY_ENTRY = 'Daily Entry',
  MONTHLY_ANALYTICS = 'Monthly Analytics',
  VIEW_RECORDS = 'View/Edit Records', // New section for listing, editing, and deleting records
}