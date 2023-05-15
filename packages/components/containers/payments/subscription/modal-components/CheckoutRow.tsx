import { ReactNode } from 'react';

import { c } from 'ttag';

import { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Price } from '../../../../components';

interface Props {
    title: ReactNode;
    amount: number;
    currency?: Currency;
    className?: string;
    suffix?: string;
    'data-testid'?: string;
}

const CheckoutRow = ({ title, amount = 0, currency, className = '', suffix, 'data-testid': dataTestId }: Props) => {
    if (amount === 0 && !currency) {
        return (
            <div className={clsx(['flex flex-nowrap flex-justify-space-between mb-4', className])}>
                <div className="pr-2">{title}</div>
                <span>{c('Price').t`Free`}</span>
            </div>
        );
    }
    return (
        <div className={clsx(['flex flex-nowrap flex-justify-space-between mb-4', className])}>
            <div className="pr-2">{title}</div>
            <Price currency={currency} suffix={suffix} data-testid={dataTestId}>
                {amount}
            </Price>
        </div>
    );
};

export default CheckoutRow;
