import type { ORGANIZATION_STATE } from '@proton/shared/lib/constants';

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
    status: ORGANIZATION_STATE;
}

export interface CompanyFormData {
    name: string;
    assignedSeats: number;
    status: ORGANIZATION_STATE;
}
