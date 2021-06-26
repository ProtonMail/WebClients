import React from 'react';
import { c } from 'ttag';
import { Currency } from 'proton-shared/lib/interfaces';

import { classnames } from '../../../helpers';
import { Price } from '../../../components';

interface Props {
    title: React.ReactNode;
    amount: number;
    currency?: Currency;
    className?: string;
}

const CheckoutRow = ({ title, amount = 0, currency, className = '' }: Props) => {
    if (amount === 0 && !currency) {
        return (
            <div className={classnames(['flex flex-nowrap flex-justify-space-between mb1', className])}>
                <div className="pr0-5">{title}</div>
                <span>{c('Price').t`Free`}</span>
            </div>
        );
    }
    return (
        <div className={classnames(['flex flex-nowrap flex-justify-space-between mb1', className])}>
            <div className="pr0-5">{title}</div>
            <Price currency={currency}>{amount}</Price>
        </div>
    );
};

export default CheckoutRow;
