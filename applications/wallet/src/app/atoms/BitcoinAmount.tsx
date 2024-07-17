import { ReactNode, useMemo } from 'react';

import { WasmApiExchangeRate, WasmBitcoinUnit } from '@proton/andromeda';
import Info from '@proton/components/components/link/Info';
import clsx from '@proton/utils/clsx';
import { DEFAULT_DISPLAY_BITCOIN_UNIT } from '@proton/wallet';

import { convertAmountStr, getLabelByUnit } from '../utils';
import { Price } from './Price';

interface Props {
    /**
     * Bitcoin amount in satoshis (1 BTC = 100_000_000 SAT)
     */
    bitcoin: number;

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
     * Display plus sign for positive amount
     */
    withPositiveSign?: boolean;

    /**
     * Additionnal info to display
     */
    info?: ReactNode;
}

export const BitcoinAmount = ({
    bitcoin,

    unit,
    exchangeRate,

    format = exchangeRate ? 'fiatFirst' : 'bitcoinFirst',

    firstClassName,
    secondClassName,
    showExplicitSign,
    showColor,

    withPositiveSign,

    info,
}: Props) => {
    const signClassName = bitcoin < 0 ? 'color-danger' : 'color-success';

    const amount = useMemo(() => {
        switch (unit?.value) {
            case 'BTC':
                return convertAmountStr(bitcoin, 'SATS', 'BTC');
            case 'MBTC':
                return convertAmountStr(bitcoin, 'SATS', 'MBTC');
            default:
                return bitcoin;
        }
    }, [unit, bitcoin]);

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
                        showColor && signClassName,
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
                        unit={exchangeRate.value ?? DEFAULT_DISPLAY_BITCOIN_UNIT}
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
                className={clsx('block mb-1', firstClassName, exchangeRate?.loading && 'skeleton-loader')}
                signClassName={showColor ? signClassName : ''}
                withPositiveSign={withPositiveSign}
                unit={exchangeRate?.value ?? DEFAULT_DISPLAY_BITCOIN_UNIT}
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
