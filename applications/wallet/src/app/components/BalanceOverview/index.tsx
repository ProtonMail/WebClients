import React from 'react';

import { c } from 'ttag';

import { WasmBitcoinUnit, WasmFiatCurrency } from '@proton/andromeda';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData } from '@proton/wallet';

import { BitcoinAmount } from '../../atoms';
import { DoughnutChart } from '../charts/DoughnutChart';
import { LineChart } from '../charts/LineChart';
import { WelcomeCard } from './WelcomeCard';
import { useBalanceOverview } from './useBalanceOverview';

// TODO: change this when wallet settings API is ready
const fiatCurrency: WasmFiatCurrency = 'USD';
const bitcoinUnit: WasmBitcoinUnit = 'BTC';

interface SingleWalletBalanceOverviewProps {
    apiWalletData: IWasmApiWalletData;
}

interface ManyWalletsBalanceOverviewProps {
    apiWalletsData: IWasmApiWalletData[];
}

type Props = SingleWalletBalanceOverviewProps | ManyWalletsBalanceOverviewProps;

export const BalanceOverview = (props: Props) => {
    const data = 'apiWalletData' in props ? props.apiWalletData : props.apiWalletsData;

    const {
        totalBalance,
        transactions,
        dataCount,
        balanceDistributionDoughnutChartData,
        balanceEvolutionLineChartData,
        last7DaysBalanceDifference,
    } = useBalanceOverview(data);

    if (!transactions.length) {
        return <WelcomeCard apiWalletData={'apiWalletData' in props ? props.apiWalletData : undefined} />;
    }

    return (
        <div>
            <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your current balance`}</h2>

            <div className="grid-auto-fill mt-4 gap-4" style={{ '--min-grid-template-column-size': '16rem' }}>
                <div data-testid="balance">
                    <p className="color-weak text-sm m-0">{c('Wallet Dashboard').t`My assets`}</p>
                    <BitcoinAmount
                        bitcoin={totalBalance}
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        firstClassName="my-0.5 text-xl"
                    />
                </div>

                {dataCount > 1 && (
                    <div>
                        <DoughnutChart data={balanceDistributionDoughnutChartData} />
                    </div>
                )}

                <div data-testid="7DaysDifference">
                    <p className="color-weak m-0 text-sm">{c('Wallet Dashboard').t`Last 7 days`}</p>
                    <BitcoinAmount
                        bitcoin={last7DaysBalanceDifference}
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        firstClassName={clsx('my-0.5 text-xl')}
                        showColor
                        showExplicitSign
                    />
                </div>

                <div>
                    <LineChart dataset={balanceEvolutionLineChartData} />
                </div>
            </div>
        </div>
    );
};
