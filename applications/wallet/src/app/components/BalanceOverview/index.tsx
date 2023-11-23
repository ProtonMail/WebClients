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
            <h2 className="h3 text-semibold">{c('Wallet Dashboard').t`Your current balance`}</h2>

            <div className="flex flex-row">
                <div className="flex flex-row mr-14 mt-8">
                    <div data-testid="balance" className="mr-3 w-custom text-no-wrap" style={{ '--w-custom': '10rem' }}>
                        <p className="color-hint m-0">{c('Wallet Dashboard').t`My assets`}</p>
                        <BitcoinAmount unit={bitcoinUnit} fiat={fiatCurrency} className="my-0.5 text-2xl">
                            {totalBalance}
                        </BitcoinAmount>
                    </div>

                    <div className="h-custom flex flex-column flex-justify-center" style={{ '--h-custom': '7rem' }}>
                        <DoughnutChart data={balanceDistributionDoughnutChartData} />
                    </div>
                </div>

                <div className="flex flex-row mt-8">
                    <div
                        data-testid="7DaysDifference"
                        className="mr-3 w-custom text-no-wrap"
                        style={{ '--w-custom': '10rem' }}
                    >
                        <p className="color-hint m-0">{c('Wallet Dashboard').t`Last 7 days`}</p>
                        <BitcoinAmount
                            unit={bitcoinUnit}
                            fiat={fiatCurrency}
                            className={clsx(
                                'my-0.5 text-2xl',
                                last7DaysBalanceDifference < 0 ? 'color-danger' : 'color-success'
                            )}
                        >
                            {last7DaysBalanceDifference}
                        </BitcoinAmount>
                    </div>

                    <div
                        className="w-custom h-custom flex flex-column flex-justify-center"
                        style={{ '--w-custom': '18rem', '--h-custom': '7rem' }}
                    >
                        <LineChart dataset={balanceEvolutionLineChartData} />
                    </div>
                </div>
            </div>
        </div>
    );
};
