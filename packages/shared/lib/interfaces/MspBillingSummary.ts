export interface MspBillingSummary {
    BillingPeriod: string;
    ManagedCompanies: number;
    TotalBilledLicenses: number;
    TotalCost: number;
    CostPerLicense: number;
}
