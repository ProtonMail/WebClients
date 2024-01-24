import React from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { WasmBitcoinUnit } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { DoughnutChart } from '../charts/DoughnutChart';
import { LineChart } from '../charts/LineChart';
import { WelcomeCard } from './WelcomeCard';
import { useBalanceOverview } from './useBalanceOverview';

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = WasmBitcoinUnit.BTC;

interface SingleWalletBalanceOverviewProps {
    wallet?: WalletWithAccountsWithBalanceAndTxs;
}

interface ManyWalletsBalanceOverviewProps {
    wallets?: WalletWithAccountsWithBalanceAndTxs[];
}

type Props = SingleWalletBalanceOverviewProps | ManyWalletsBalanceOverviewProps;

export const BalanceOverview = (props: Props) => {
    const data = 'wallet' in props ? props.wallet : 'wallets' in props ? props.wallets : undefined;

    const {
        totalBalance,
        transactions,
        dataCount,
        balanceDistributionDoughnutChartData,
        balanceEvolutionLineChartData,
        last7DaysBalanceDifference,
    } = useBalanceOverview(data);

    if (!transactions) {
        return <WelcomeCard wallet={'wallet' in props ? props.wallet : undefined} />;
    }

    return (
        <div>
            <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your current balance`}</h2>

            <div className="grid-auto-fill mt-4 gap-4" style={{ '--min-grid-template-column-size': '16rem' }}>
                <div data-testid="balance">
                    <p className="color-weak text-sm m-0">{c('Wallet Dashboard').t`My assets`}</p>
                    <BitcoinAmount unit={bitcoinUnit} fiat={fiatCurrency} className="my-0.5 text-xl">
                        {totalBalance}
                    </BitcoinAmount>
                </div>

                {dataCount > 1 && (
                    <div>
                        <DoughnutChart data={balanceDistributionDoughnutChartData} />
                    </div>
                )}

                <div data-testid="7DaysDifference">
                    <p className="color-weak m-0 text-sm">{c('Wallet Dashboard').t`Last 7 days`}</p>
                    <BitcoinAmount
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        className={clsx('my-0.5 text-xl')}
                        showColor
                        showExplicitSign
                    >
                        {last7DaysBalanceDifference}
                    </BitcoinAmount>
                </div>

                <div>
                    <LineChart dataset={balanceEvolutionLineChartData} />
                </div>
            </div>
        </div>
    );
};
