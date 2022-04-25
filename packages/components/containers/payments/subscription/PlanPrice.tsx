import { c } from 'ttag';
import { DEFAULT_CYCLE, DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { Currency, Cycle } from '@proton/shared/lib/interfaces';

import Price, { Props as PriceProps } from '../../../components/price/Price';

interface Props extends Omit<PriceProps, 'suffix' | 'children'> {
    quantity?: number;
    amount?: number;
    cycle?: Cycle;
    currency?: Currency;
    suffix?: string;
}

const PlanPrice = ({
    quantity = 1,
    amount = 0,
    cycle = DEFAULT_CYCLE,
    currency = DEFAULT_CURRENCY,
    suffix,
    ...rest
}: Props) => {
    return (
        <Price currency={currency} suffix={suffix || c('Suffix').t`/month`} {...rest}>
            {(quantity * amount) / cycle}
        </Price>
    );
};

export default PlanPrice;
