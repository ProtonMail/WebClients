import { useLayoutEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';

import { ChartOptions } from 'chart.js';
import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { Icon } from '@proton/components/components';
import { useToggle } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData } from '@proton/wallet';

import { CoreButton } from '../../atoms';
import { Price } from '../../atoms/Price';
import { COMPUTE_BITCOIN_UNIT } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';
import { useWalletAccountExchangeRate } from '../../hooks/useWalletAccountExchangeRate';
import { useUserWalletSettings } from '../../store/hooks/useUserWalletSettings';
import { convertAmount, getLabelByUnit } from '../../utils';
import { useBalance } from './useBalance';

import './Balance.scss';

export const lineChartOptions: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    scales: {
        x: { display: false },
        y: { display: false },
    },
    plugins: {
        legend: { display: false },
        title: { display: false },
    },
};

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
}

export const Balance = ({ apiWalletData, apiAccount }: Props) => {
    const [settings] = useUserWalletSettings();
    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(
        apiAccount ?? apiWalletData.WalletAccounts[0]
    );

    const { isNarrow } = useResponsiveContainerContext();
    const { getSyncingData } = useBitcoinBlockchainContext();

    const syncingData = getSyncingData(apiWalletData.Wallet.ID, apiAccount?.ID);

    const balanceRef = useRef<HTMLDivElement>(null);
    const { state: showBalance, toggle: toggleShowBalance } = useToggle(true);

    const [lineColor, setLineColor] = useState<string>();

    const { totalBalance, balanceEvolutionLineChartData } = useBalance(apiWalletData, apiAccount);

    // After focused wallet change, we need to wait for DOM update to get the correct subtheme colors, instead of N-1 ones'
    useLayoutEffect(() => {
        setLineColor(window.getComputedStyle(balanceRef.current as Element).getPropertyValue('--interaction-norm'));
    }, [apiWalletData.Wallet.ID]);

    return (
        <div className="wallet-balance flex flex-row flex-nowrap py-2 px-0 m-4 items-center">
            <div key={apiWalletData.Wallet.ID} ref={balanceRef} className="flex flex-column">
                <div className="text-lg color-hint">
                    {apiAccount ? apiAccount.Label : c('Wallet dashboard').t`All accounts`}
                </div>
                <div className="flex flex-row flex-nowrap items-center my-1">
                    <div
                        className={clsx(
                            'text-semibold',
                            (loadingExchangeRate || (syncingData?.syncing && !totalBalance)) && 'skeleton-loader'
                        )}
                    >
                        <Price
                            className="h1 text-semibold"
                            amountClassName={clsx(!showBalance && 'blurred')}
                            wrapperClassName="contrast"
                            unit={exchangeRate ?? settings.BitcoinUnit}
                            satsAmount={totalBalance}
                        />
                    </div>

                    <CoreButton shape="ghost" className="ml-2">
                        <Icon name={showBalance ? 'eye-slash' : 'eye'} size={6} onClick={() => toggleShowBalance()} />
                    </CoreButton>
                </div>
                <div className={clsx('text-lg color-hint', syncingData?.syncing && !totalBalance && 'skeleton-loader')}>
                    {convertAmount(totalBalance, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                    {getLabelByUnit(settings.BitcoinUnit)}
                </div>
            </div>

            {!isNarrow && (
                <div
                    className="h-custom grow max-w-custom grow ml-12"
                    style={{ '--h-custom': '3.5rem', '--max-w-custom': '35rem' }}
                >
                    <Line
                        id="line-chart"
                        className="w-full h-full"
                        options={lineChartOptions}
                        data={{
                            datasets: [
                                {
                                    ...balanceEvolutionLineChartData,
                                    borderColor: lineColor,
                                    borderWidth: 2,
                                    tension: 0,
                                    pointRadius: 0,
                                },
                            ],
                            labels: balanceEvolutionLineChartData.data.map(({ x }) => x),
                        }}
                    />
                </div>
            )}
        </div>
    );
};
