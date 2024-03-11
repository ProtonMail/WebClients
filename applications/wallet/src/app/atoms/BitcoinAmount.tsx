import { ReactNode, useMemo } from 'react';

import { WasmBitcoinUnit } from '@proton/andromeda';
import Info from '@proton/components/components/link/Info';
import { Price } from '@proton/components/components/price';
import { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { getLabelByUnit, satsToBitcoin, satsToMBitcoin, toFiat } from '../utils';

interface Props {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    bitcoin: number;
    precision?: number;
    unit?: WasmBitcoinUnit;

    fiat?: Currency;

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

    /**
     * Additionnal info to display
     */
    info?: ReactNode;
}

export const BitcoinAmount = ({
    bitcoin,
    unit,
    precision = 6,

    fiat,

    format = fiat ? 'fiatFirst' : 'bitcoinFirst',

    firstClassName,
    secondClassName,
    showExplicitSign,
    showColor,

    info,
}: Props) => {
    const colorClassName = bitcoin < 0 ? 'color-danger' : 'color-success';

    const amount = useMemo(() => {
        switch (unit) {
            case 'BTC':
                return satsToBitcoin(bitcoin).toFixed(precision);
            case 'MBTC':
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
                    {amount} {getLabelByUnit(unit ?? 'SATS')}
                </span>
                {info && <Info title={info} />}
                {fiat && (
                    <Price
                        className={clsx('block color-hint m-0 text-sm', secondClassName)}
                        currency={fiat}
                        prefix={sign}
                    >
                        {toFiat(bitcoin).toFixed(2)}
                    </Price>
                )}
            </>
        );
    }

    return (
        <>
            <Price
                data-testid="first-content"
                className={clsx('block', firstClassName, showColor && colorClassName)}
                currency={fiat}
                prefix={sign}
            >
                {toFiat(bitcoin).toFixed(2)}
            </Price>
            {info && <Info title={info} />}
            {unit !== undefined && (
                <span className={clsx('block color-hint m-0 text-sm', secondClassName)}>
                    {sign}
                    {amount} {getLabelByUnit(unit)}
                </span>
            )}
        </>
    );
};
