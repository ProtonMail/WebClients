import { useMemo } from 'react';

import { Price } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { BitcoinUnit } from '../types';
import { satsToBitcoin, satsToMBitcoin, toFiat } from '../utils';

interface Props {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SATS)
     */
    children: number;
    precision?: number;

    unit?: BitcoinUnit;
    fiat?: string;

    className?: string;
    fiatClassName?: string;
}

export const BitcoinAmount = ({
    unit = BitcoinUnit.BTC,
    fiat,
    children,
    precision = 6,
    className,
    fiatClassName,
}: Props) => {
    const amount = useMemo(() => {
        switch (unit) {
            case BitcoinUnit.BTC:
                return satsToBitcoin(children).toFixed(precision);
            case BitcoinUnit.MBTC:
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
