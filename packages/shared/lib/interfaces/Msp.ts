import type { Currency } from '@proton/payments/core/interface';

import type { MspDelegatedManager } from '../api/msp';
import type { ORGANIZATION_STATE } from '../constants';

export interface MspSubsidiary {
    ID: string;
    Name: string;
    Status: ORGANIZATION_STATE; // Only ACTIVE and DISABLED are used for MSP subsidiaries for now
    MaxMembers: number;
    ActiveMembers: number;
    ParentOrgToken: string | undefined;
    DelegatedManagers: MspDelegatedManager[];
}

export interface MspBillingSummary {
    BillingPeriod: string;
    ManagedCompanies: number;
    TotalBilledLicenses: number;
    TotalCost: number;
    TotalCostCurrency: Currency;
    CostPerLicense: number;
    CostPerLicenseCurrency: Currency;
}

export interface MspBillingPeriod {
    BillingPeriod: string;
    Period: string; // "YYYY-MM"
    ManagedCompanies: number;
    BillableLicenses: number;
    TotalCost: number;
    Currency: Currency;
}

export interface MspBillingPeriodsResponse {
    BillingPeriods: MspBillingPeriod[];
    Total: number;
}

export interface MspLicenseAmount {
    LicenseType: string;
    Amount: number;
}

export interface MspDailyLicenseUsage {
    UsageDate: string;
    Total: number;
    Licenses: MspLicenseAmount[];
}

export interface MspDailyUsage {
    BillingPeriod: string;
    PeriodStart: string;
    DataThroughDate: string | null;
    DaysInPeriod: number;
    Days: MspDailyLicenseUsage[];
}
