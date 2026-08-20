import type { Currency } from '@proton/payments/core/interface';

export interface MspBillingSummary {
    BillingPeriod: string;
    ManagedCompanies: number;
    TotalBilledLicenses: number;
    TotalCost: number;
    TotalCostCurrency: Currency;
    CostPerLicense: number;
    CostPerLicenseCurrency: Currency;
}
