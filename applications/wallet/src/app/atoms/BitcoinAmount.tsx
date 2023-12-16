import { useMemo } from 'react';

import { Price } from '@proton/components/components/price';
import clsx from '@proton/utils/clsx';

import { BitcoinUnitEnum } from '../types';
import { satsToBitcoin, satsToMBitcoin, toFiat } from '../utils';

interface Props {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    children: number;
    precision?: number;

    unit?: BitcoinUnitEnum;
    fiat?: string;

    className?: string;
    fiatClassName?: string;
}

export const BitcoinAmount = ({
    unit = BitcoinUnitEnum.BTC,
    fiat,
    children,
    precision = 6,
    className,
    fiatClassName,
}: Props) => {
    const amount = useMemo(() => {
        switch (unit) {
            case BitcoinUnitEnum.BTC:
                return satsToBitcoin(children).toFixed(precision);
            case BitcoinUnitEnum.mBTC:
                return satsToMBitcoin(children).toFixed(precision - 3);
            default:
                return children;
        }
    }, [unit, children, precision]);

    return (
        <>
            <span className={clsx('block', className)}>
                {amount} {unit}
            </span>
            {fiat && (
                <Price className={clsx('color-hint m-0 text-sm', fiatClassName)} currency={fiat}>
                    {toFiat(children).toFixed(2)}
                </Price>
            )}
        </>
    );
};
