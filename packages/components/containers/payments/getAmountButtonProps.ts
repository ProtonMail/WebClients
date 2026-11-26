import { getCurrencyFormattingConfig } from '@proton/payments/core/currencies';
import type { Currency } from '@proton/payments/core/interface';

/** The amount state is in minor units; whole-unit presets (e.g. credits) show as a plain count instead of a price. */
export const getAmountButtonProps = ({
    value,
    amount,
    currency,
    inWholeUnits,
}: {
    value: number;
    amount: number;
    currency: Currency;
    inWholeUnits: boolean;
}) => {
    if (!inWholeUnits) {
        return { value, amount, currency };
    }
    const { divisor } = getCurrencyFormattingConfig(currency);
    return { value: value / divisor, amount: amount / divisor };
};
