export const PAYMENTS_API_ERROR_CODES = {
    /**
     * Happens if user is using VAT reverse charge and selects a plan that doesn't support it.
     */
    VAT_REVERSE_CHARGE_NOT_SUPPORTED: 800_001,
    WRONG_BILLING_ADDRESS: 800_002,
    INVALID_COUPON: 800_003,
} as const;
