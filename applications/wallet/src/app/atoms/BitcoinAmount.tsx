import { ReactNode, useMemo } from 'react';

import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import Info from '@proton/components/components/link/Info';
import clsx from '@proton/utils/clsx';

import { getLabelByUnit, satsToBitcoin, satsToMBitcoin } from '../utils';
import { Price } from './Price';

interface Props {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    bitcoin: number;
    precision?: number;

    unit?: { value?: WasmBitcoinUnit; loading?: boolean };
    exchangeRate?: { value?: WasmApiExchangeRate; loading?: boolean };

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
    precision = 6,

    unit,
    exchangeRate,

    format = exchangeRate ? 'fiatFirst' : 'bitcoinFirst',

    firstClassName,
    secondClassName,
    showExplicitSign,
    showColor,

    info,
}: Props) => {
    const colorClassName = bitcoin < 0 ? 'color-danger' : 'color-success';

    const amount = useMemo(() => {
        switch (unit?.value) {
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
                    className={clsx(
                        'block mb-1',
                        firstClassName,
                        showColor && colorClassName,
                        unit?.loading === undefined && 'skeleton-loader'
                    )}
                >
                    {unit?.value ? (
                        <>
                            {sign}
                            {amount} {getLabelByUnit(unit.value)}
                        </>
                    ) : (
                        '-'
                    )}
                </span>

                {info && <Info title={info} />}
                {exchangeRate && (
                    <Price
                        className={clsx(
                            'block color-hint m-0 text-sm',
                            secondClassName,
                            exchangeRate.loading && 'skeleton-loader'
                        )}
                        prefix={sign}
                        unit={exchangeRate.value ?? 'BTC'}
                        satsAmount={bitcoin}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <Price
                data-testid="first-content"
                className={clsx(
                    'block mb-1',
                    firstClassName,
                    showColor && colorClassName,
                    exchangeRate?.loading && 'skeleton-loader'
                )}
                prefix={sign}
                unit={exchangeRate?.value ?? 'BTC'}
                satsAmount={bitcoin}
            />

            {info && <Info title={info} />}
            {unit && (
                <span
                    className={clsx(
                        'block color-hint m-0 text-sm',
                        secondClassName,
                        unit?.loading && 'skeleton-loader'
                    )}
                >
                    {unit?.value ? (
                        <>
                            {sign}
                            {amount} {getLabelByUnit(unit.value)}
                        </>
                    ) : (
                        '-'
                    )}
                </span>
            )}
        </>
    );
};
