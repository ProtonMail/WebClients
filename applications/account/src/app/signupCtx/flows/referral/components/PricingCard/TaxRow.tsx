import { Price } from '@proton/components';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { formatTax } from '@proton/payments/ui/headless-checkout/tax-helpers';

interface TaxRowProps {
    checkResult: SubscriptionEstimation;
}

export const TaxRow = ({ checkResult }: Partial<TaxRowProps>) => {
    if (!checkResult) {
        return null;
    }

    const formattedTax = formatTax(checkResult);
    if (!formattedTax) {
        return null;
    }

    const { taxRateElement, currency, amount } = formattedTax;

    const price = (
        <Price key="price" currency={currency} data-testid="taxAmount">
            {amount}
        </Price>
    );

    return (
        <div className="flex justify-space-between gap-2" data-testid="tax">
            <span>{taxRateElement}</span>
            <span>{price}</span>
        </div>
    );
};
