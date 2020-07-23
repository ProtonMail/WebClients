import { CYCLE, PLAN_TYPES } from '../constants';

type Currency = 'EUR' | 'CHF' | 'USD';

export interface Plan {
    ID: string;
    Type: PLAN_TYPES;
    Cycle: CYCLE;
    Name: string;
    Title: string;
    Currency: Currency;
    Amount: number;
    MaxDomains: number;
    MaxAddresses: number;
    MaxSpace: number;
    MaxMembers: number;
    MaxVPN: number;
    MaxTier: number;
    Services: number;
    Features: number;
    Quantity: number;
}

export interface Subscription {
    ID: string;
    InvoiceID: string;
    Cycle: CYCLE;
    PeriodStart: number;
    PeriodEnd: number;
    CouponCode: null | string;
    Currency: Currency;
    Amount: number;
    Plans: Plan[];
}
