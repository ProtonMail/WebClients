import type { ReactNode } from 'react';

import { c } from 'ttag';

import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import Price from '@proton/components/components/price/Price';
import type { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

export interface Props {
    title: ReactNode;
    amount: number;
    currency?: Currency;
    className?: string;
    suffix?: ReactNode;
    loading?: boolean;
    'data-testid'?: string;
    star?: boolean;
}

const CheckoutRow = ({
    title,
    amount = 0,
    currency,
    className = '',
    suffix,
    loading = false,
    star,
    'data-testid': dataTestId,
}: Props) => {
    if (amount === 0 && !currency) {
        return (
            <div className={clsx(['flex flex-nowrap justify-space-between mb-4', className])}>
                <div className="pr-2">{title}</div>
                <span>{c('Price').t`Free`}</span>
            </div>
        );
    }
    return (
        <>
            <div className={clsx(['flex flex-nowrap justify-space-between', className])}>
                <div className="pr-2">{title}</div>
                {loading ? (
                    <EllipsisLoader />
                ) : (
                    <span>
                        <Price currency={currency} data-testid={dataTestId}>
                            {amount}
                        </Price>
                        {star ? '*' : null}
                    </span>
                )}
            </div>
            <div className="mb-4 flex justify-end" data-testid="next-line-suffix">
                {suffix}
            </div>
        </>
    );
};

export default CheckoutRow;
