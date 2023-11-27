import React from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { BitcoinAmount } from '../../atoms';
import { BitcoinUnit, Transaction, Wallet } from '../../types';
import { DoughnutChart } from '../charts/DoughnutChart';
import { LineChart } from '../charts/LineChart';
import { useBalanceOverview } from './useBalanceOverview';

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = BitcoinUnit.BTC;

interface Props {
    wallets: Wallet[];
    transactions: Transaction[];
}

export const BalanceOverview = ({ wallets, transactions }: Props) => {
    const {
        totalBalance,
        balanceDistributionDoughnutChartData,
        balanceEvolutionLineChartData,
        last7DaysBalanceDifference,
    } = useBalanceOverview(wallets, transactions);

    return (
        <div>
            <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your current balance`}</h2>

            <div className="flex flex-row flex-justify-space-evenly">
                <div data-testid="balance" className="mt-8 mr-3 w-custom text-no-wrap" style={{ '--w-custom': '8rem' }}>
                    <p className="color-hint text-sm m-0">{c('Wallet Dashboard').t`My assets`}</p>
                    <BitcoinAmount unit={bitcoinUnit} fiat={fiatCurrency} className="my-0.5 text-xl">
                        {totalBalance}
                    </BitcoinAmount>
                </div>

                {wallets.length > 1 && (
                    <div
                        className="mt-8 mr-10 h-custom flex flex-column flex-justify-center"
                        style={{ '--h-custom': '6rem' }}
                    >
                        <DoughnutChart data={balanceDistributionDoughnutChartData} />
                    </div>
                )}

                <div
                    data-testid="7DaysDifference"
                    className="mt-8 mr-3 w-custom text-no-wrap"
                    style={{ '--w-custom': '8rem' }}
                >
                    <p className="color-hint m-0 text-sm">{c('Wallet Dashboard').t`Last 7 days`}</p>
                    <BitcoinAmount
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        className={clsx(
                            'my-0.5 text-xl',
                            last7DaysBalanceDifference < 0 ? 'color-danger' : 'color-success'
                        )}
                    >
                        {last7DaysBalanceDifference}
                    </BitcoinAmount>
                </div>

                <div
                    className="mt-8 w-custom h-custom flex flex-column flex-justify-center"
                    style={{ '--w-custom': '14rem', '--h-custom': '6rem' }}
                >
                    <LineChart dataset={balanceEvolutionLineChartData} />
                </div>
            </div>
        </div>
    );
};
