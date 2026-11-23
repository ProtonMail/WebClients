import { SkeletonLoader } from '@proton/atoms/SkeletonLoader/SkeletonLoader';
import Price from '@proton/components/components/price/Price';
import { formatTax } from '@proton/payments-ui/ui/headless-checkout/tax-helpers';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';

interface TaxRowProps {
    checkResult: SubscriptionEstimation;
    /** The tax may still change, e.g. while another currency or billing country is checked */
    loading: boolean;
}

export const TaxRow = ({ checkResult, loading }: Partial<TaxRowProps>) => {
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
            <span>{loading ? <SkeletonLoader width="5rem" height="1.25rem" /> : price}</span>
        </div>
    );
};
