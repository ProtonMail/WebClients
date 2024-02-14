import { useMemo } from 'react';

import { Price } from '@proton/components/components/price';
import clsx from '@proton/utils/clsx';

import { WasmBitcoinUnit } from '../../pkg';
import { getLabelByUnit, satsToBitcoin, satsToMBitcoin, toFiat } from '../utils';

interface Props {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    bitcoin: number;
    precision?: number;
    unit?: WasmBitcoinUnit;

    fiat?: string;

    format?: 'fiatFirst' | 'bitcoinFirst';

    firstClassName?: string;
    secondClassName?: string;

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
    bitcoin,
    unit = WasmBitcoinUnit.BTC,
    precision = 6,

    fiat,

    format = fiat ? 'fiatFirst' : 'bitcoinFirst',

    firstClassName,
    secondClassName,
    showExplicitSign,
    showColor,
}: Props) => {
    const colorClassName = bitcoin < 0 ? 'color-danger' : 'color-success';

    const amount = useMemo(() => {
        switch (unit) {
            case WasmBitcoinUnit.BTC:
                return satsToBitcoin(bitcoin).toFixed(precision);
            case WasmBitcoinUnit.MBTC:
                return satsToMBitcoin(bitcoin).toFixed(precision - 3);
            default:
                return bitcoin;
        }
    }, [unit, bitcoin, precision]);

    const sign = useMemo(() => {
        if (showExplicitSign && bitcoin > 0) {
            return '+';
        }

        return '';
    }, [bitcoin, showExplicitSign]);

    if (format === 'bitcoinFirst') {
        return (
            <>
                <span
                    data-testid="first-content"
                    className={clsx('block', firstClassName, showColor && colorClassName)}
                >
                    {sign}
                    {amount} {getLabelByUnit(unit)}
                </span>
                <Price className={clsx('color-hint m-0 text-sm', secondClassName)} currency={fiat} prefix={sign}>
                    {toFiat(bitcoin).toFixed(2)}
                </Price>
            </>
        );
    }

    return (
        <>
            <div data-testid="first-content">
                <Price className={clsx(firstClassName, showColor && colorClassName)} currency={fiat} prefix={sign}>
                    {toFiat(bitcoin).toFixed(2)}
                </Price>
            </div>
            <span className={clsx('color-hint m-0 text-sm', secondClassName)}>
                {sign}
                {amount} {getLabelByUnit(unit)}
            </span>
        </>
    );
};
