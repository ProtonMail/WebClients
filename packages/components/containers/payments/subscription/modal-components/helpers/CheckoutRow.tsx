import type { ReactNode } from 'react';

import type { Currency } from '@proton/payments/core/interface';
import clsx from '@proton/utils/clsx';

import EllipsisLoader from '../../../../../components/loader/EllipsisLoader';
import Price from '../../../../../components/price/Price';

export interface Props {
    title: ReactNode;
    amount: number;
    currency: Currency;
    className?: string;
    suffix?: ReactNode;
    loading?: boolean;
    'data-testid'?: string;
}

const CheckoutRow = ({ title, amount, currency, className, suffix, loading, 'data-testid': dataTestId }: Props) => {
    return (
        <>
            <div
                className={clsx(['flex flex-nowrap justify-space-between', className])}
                data-testid={`container-${dataTestId}`}
            >
                <div className="pr-2">{title}</div>
                {loading ? (
                    <EllipsisLoader />
                ) : (
                    <span>
                        <Price currency={currency} data-testid={dataTestId}>
                            {amount}
                        </Price>
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
