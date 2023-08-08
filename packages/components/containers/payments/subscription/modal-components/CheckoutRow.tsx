import { ReactNode } from 'react';

import { c } from 'ttag';

import { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { EllipsisLoader, Price } from '../../../../components';

export interface Props {
    title: ReactNode;
    amount: number;
    currency?: Currency;
    className?: string;
    suffix?: ReactNode;
    suffixNextLine?: boolean;
    loading?: boolean;
    'data-testid'?: string;
}

const CheckoutRow = ({
    title,
    amount = 0,
    currency,
    className = '',
    suffix,
    suffixNextLine = false,
    loading = false,
    'data-testid': dataTestId,
}: Props) => {
    if (amount === 0 && !currency) {
        return (
            <div className={clsx(['flex flex-nowrap flex-justify-space-between mb-4', className])}>
                <div className="pr-2">{title}</div>
                <span>{c('Price').t`Free`}</span>
            </div>
        );
    }
    return (
        <>
            <div
                className={clsx(['flex flex-nowrap flex-justify-space-between', !suffixNextLine && 'mb-4', className])}
            >
                <div className="pr-2">{title}</div>
                {loading ? (
                    <EllipsisLoader />
                ) : (
                    <Price currency={currency} suffix={suffixNextLine ? null : suffix} data-testid={dataTestId}>
                        {amount}
                    </Price>
                )}
            </div>
            {suffixNextLine ? (
                <div className="mb-4 flex flex-justify-end" data-testid="next-line-suffix">
                    {suffix}
                </div>
            ) : null}
        </>
    );
};

export default CheckoutRow;
