export type BillingAddress = {
    CountryCode: string;
    State?: string | null;
};

export type BillingAddressProperty = {
    BillingAddress: BillingAddress;
};

const DEFAULT_TAX_COUNTRY_CODE = 'CH';
export const DEFAULT_TAX_BILLING_ADDRESS: BillingAddress = {
    CountryCode: DEFAULT_TAX_COUNTRY_CODE,
    State: null,
};
