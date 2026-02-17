export const PAYMENTS_API_ERROR_CODES = {
    WRONG_ZIP_CODE: 800_000,
    /**
     * Happens if user is tax exempt and selects a plan that doesn't support tax exemption.
     */
    TAX_EXEMPTION_NOT_SUPPORTED: 800_001,
} as const;
