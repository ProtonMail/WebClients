export type CompanyStatus = 'active' | 'disabled' | 'on-hold';

export interface SeatDay {
    date: string; // ISO "YYYY-MM-DD"
    seats: number;
}

export interface MonthlyRow {
    year: number;
    month: number; // 0-indexed
    companies: number;
    seats: number;
    cost: number;
}

export interface MspCompany {
    id: string;
    name: string;
    assignedSeats: number;
    usedSeats: number;
    status: CompanyStatus;
}

export interface CompanyFormData {
    name: string;
    assignedSeats: number;
    status: CompanyStatus;
}
