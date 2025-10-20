import type { Currency } from '@proton/payments';

export type SUPPORTED_PRODUCTS = 'mail' | 'drive';

export interface UnlimitedToDuoConfig {
    currency: Currency;
    price: number;
}
