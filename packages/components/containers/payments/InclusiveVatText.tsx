import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import type { Currency, Tax } from '@proton/shared/lib/interfaces';
import withDecimalPrecision from '@proton/utils/withDecimalPrecision';

interface Props {
    tax: Tax;
    currency: Currency;
    className?: string;
}

const InclusiveVatText = ({ tax, currency, className }: Partial<Props>) => {
    if (!tax || !currency) {
        return null;
    }

    const formattedTaxRate = withDecimalPrecision(tax.Rate, 4);
    const price = (
        <Price key="price" currency={currency} data-testid="taxAmount">
            {tax.Amount}
        </Price>
    );
    const taxName = tax.Name ?? c('Label').t`VAT`;

    return (
        <div className={className} data-testid="tax">
            <span>{c('Info').jt`Including ${formattedTaxRate}% ${taxName}: ${price}`}</span>
        </div>
    );
};

export default InclusiveVatText;
