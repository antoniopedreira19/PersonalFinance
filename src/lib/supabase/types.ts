export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      banks: {
        Row: {
          color: string
          created_at: string
          current_balance: number
          id: string
          is_active: boolean
          name: string
          slug: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          user_id?: string
        }
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
      }
      investment_goals: {
        Row: {
          created_at: string
          id: string
          month: string
          target_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          target_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          target_amount?: number
          user_id?: string
        }
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
        }
      }
      recurring_templates: {
        Row: {
          amount: number
          bank_id: string
          category_id: string
          created_at: string
          day_of_month: number
          description: string
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_id: string
          category_id: string
          created_at?: string
          day_of_month: number
          description: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_id?: string
          category_id?: string
          created_at?: string
          day_of_month?: number
          description?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string
          type?: string
          user_id?: string
        }
      }
      transactions: {
        Row: {
          amount: number
          bank_id: string
          category_id: string
          created_at: string
          date: string
          description: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          notes: string | null
          recurring_template_id: string | null
          subtype: string
          total_installments: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_id: string
          category_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          notes?: string | null
          recurring_template_id?: string | null
          subtype: string
          total_installments?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_id?: string
          category_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          notes?: string | null
          recurring_template_id?: string | null
          subtype?: string
          total_installments?: number | null
          type?: string
          user_id?: string
        }
      }
    }
  }
}

// Convenience types
export type Bank = Database["public"]["Tables"]["banks"]["Row"]
export type BankInsert = Database["public"]["Tables"]["banks"]["Insert"]
export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"]
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"]
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"]
export type InvestmentGoal = Database["public"]["Tables"]["investment_goals"]["Row"]
export type InvestmentGoalInsert = Database["public"]["Tables"]["investment_goals"]["Insert"]
export type RecurringTemplate = Database["public"]["Tables"]["recurring_templates"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export type TransactionType = "income" | "expense" | "investment"
export type TransactionSubtype = "recurring" | "non_recurring" | "fixed" | "installment" | "daily" | "investment"
export type CategoryType = "income" | "expense"

export type TransactionWithRelations = Transaction & {
  banks: Pick<Bank, "id" | "name" | "slug" | "color">
  categories: Pick<Category, "id" | "name" | "color" | "icon">
}
