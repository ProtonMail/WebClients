import type { RequiredCheckResponse } from '../../core/checkout';
import { isTaxInclusive } from '../../core/subscription/helpers';
import { formatTax } from '../headless-checkout/tax-helpers';

interface Props {
    checkResult: RequiredCheckResponse;
    className?: string;
}

const VatText = ({ checkResult, className }: Partial<Props>) => {
    if (!checkResult) {
        return null;
    }

    const formattedTax = formatTax(checkResult);
    if (!formattedTax) {
        return null;
    }

    return (
        <div className={className} data-testid="tax">
            <span>{formattedTax.taxRateAndAmountElement}</span>
        </div>
    );
};

export const InclusiveVatText = ({ checkResult, className }: Partial<Props>) => {
    if (!checkResult || !isTaxInclusive(checkResult)) {
        return null;
    }

    return <VatText checkResult={checkResult} className={className} />;
};
