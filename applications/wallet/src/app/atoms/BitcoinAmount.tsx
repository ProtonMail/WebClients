import { useMemo } from 'react';

import { Price } from '@proton/components/components/price';
import clsx from '@proton/utils/clsx';

import { WasmBitcoinUnit } from '../../pkg';
import { getLabelByUnit, satsToBitcoin, satsToMBitcoin, toFiat } from '../utils';

interface Props {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    children: number;
    precision?: number;

    unit?: WasmBitcoinUnit;
    fiat?: string;

    className?: string;
    fiatClassName?: string;
    /**
     * Show sign even when amount is positive
     */
    showExplicitSign?: boolean;
    /**
     * Display negative amount in red and positive/null amount in green
     */
    showColor?: boolean;
}

export const BitcoinAmount = ({
    unit = WasmBitcoinUnit.BTC,
    fiat,
    children,
    precision = 6,
    className,
    fiatClassName,
    showExplicitSign,
    showColor,
}: Props) => {
    const colorClassName = children < 0 ? 'color-danger' : 'color-success';

    const amount = useMemo(() => {
        switch (unit) {
            case WasmBitcoinUnit.BTC:
                return satsToBitcoin(children).toFixed(precision);
            case WasmBitcoinUnit.MBTC:
                return satsToMBitcoin(children).toFixed(precision - 3);
            default:
                return children;
        }
    }, [unit, children, precision]);

    const sign = useMemo(() => {
        if (showExplicitSign && children > 0) {
            return '+';
        }

        return '';
    }, [children, showExplicitSign]);

    return (
        <>
            <span className={clsx('block', className, showColor && colorClassName)}>
                {sign}
                {amount} {getLabelByUnit(unit)}
            </span>
            {fiat && (
                <Price className={clsx('color-hint m-0 text-sm', fiatClassName)} currency={fiat} prefix={sign}>
                    {toFiat(children).toFixed(2)}
                </Price>
            )}
        </>
    );
};
