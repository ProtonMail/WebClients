import React from 'react';

import { c } from 'ttag';

import { Price } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { Transaction, Wallet } from '../../types';
import { satsToBitcoin, toFiat } from '../../utils';
import { DoughnutChart } from '../charts/DoughnutChart';
import { LineChart } from '../charts/LineChart';
import { useBalanceOverview } from './useBalanceOverview';

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = 'BTC';

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
                        <p className="my-0.5 text-2xl">
                            {satsToBitcoin(totalBalance).toFixed(6)} {bitcoinUnit}
                        </p>
                        <Price className="color-hint m-0 text-sm" currency={fiatCurrency}>
                            {toFiat(totalBalance).toFixed(2)}
                        </Price>
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
                        <p
                            className={clsx(
                                'my-0.5 text-2xl',
                                last7DaysBalanceDifference < 0 ? 'color-danger' : 'color-success'
                            )}
                        >
                            {satsToBitcoin(last7DaysBalanceDifference).toFixed(6)} {bitcoinUnit}
                        </p>
                        <Price className="color-hint m-0 text-sm" currency={fiatCurrency}>
                            {toFiat(last7DaysBalanceDifference).toFixed(2)}
                        </Price>
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
