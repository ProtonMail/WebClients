import type { ReactNode } from 'react';
import { Line } from 'react-chartjs-2';

import { type ChartOptions } from 'chart.js';
import { first, last } from 'lodash';
import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { Tooltip } from '@proton/components/components';
import btcSvg from '@proton/styles/assets/img/illustrations/btc.svg';
import clsx from '@proton/utils/clsx';
import type { IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton } from '../../atoms/Button';
import { CorePrice } from '../../atoms/Price';
import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';
import { useWalletAccountExchangeRate } from '../../hooks/useWalletAccountExchangeRate';
import { usePriceGraphData } from '../../store/hooks/usePriceGraphData';
import { useBalance } from '../Balance/useBalance';

import './MetricsAndCtas.scss';

const lineChartOptions: ChartOptions<'line'> = {
    maintainAspectRatio: false,
    scales: {
        x: { display: false, beginAtZero: false },
        y: { display: false, beginAtZero: false },
    },
    plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: { enabled: false },
    },
};

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    disabled?: boolean;
    onClickSend: () => void;
    onClickReceive: () => void;
    onClickBuy: () => void;
}

export const MetricsAndCtas = ({
    apiAccount,
    apiWalletData,
    disabled,
    onClickSend,
    onClickReceive,
    onClickBuy,
}: Props) => {
    const account = apiAccount ?? apiWalletData.WalletAccounts[0];
    const localDisabled = !account || disabled;
    const { isNarrow } = useResponsiveContainerContext();

    const { totalBalance } = useBalance(apiWalletData, apiAccount);

    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(account);
    const [priceGraphData = { GraphData: [] }] = usePriceGraphData(account.FiatCurrency, 'OneDay');

    const firstDataPoint = first(priceGraphData.GraphData)?.ExchangeRate ?? 0;
    const absoluteChange = (last(priceGraphData.GraphData)?.ExchangeRate ?? 0) - firstDataPoint;
    const percentChange = (absoluteChange / firstDataPoint) * 100;

    const canSend = totalBalance > 0;
    const commonProps = {
        className: 'text-lg w-custom mx-1 rounded-full grow',
        style: { '--w-custom': isNarrow ? '5rem' : '7.5rem' },
        disabled: localDisabled || !canSend,
    };

    const CtaButton = (props: { children: ReactNode; onClick?: () => void; disabled?: boolean }) => {
        return isNarrow ? (
            <CoreButton shape="ghost" color="weak" {...commonProps} {...props} />
        ) : (
            <Button shape="solid" color="norm" {...commonProps} {...props} />
        );
    };

    return (
        <div
            className={clsx(
                'metrics-and-ctas flex bg-weak rounded-xl justify-space-between',
                isNarrow ? 'flex-column items-start p-4 mx-2 my-4' : 'flex-row items-center p-6 m-4'
            )}
        >
            <div className="flex flex-row max-w-custom my-2 items-center" style={{ '--max-w-custom': '50rem' }}>
                <div className="mr-3">
                    <img src={btcSvg} alt={c('Info').t`Bitcoin`} />
                </div>

                <div className="flex flex-row justify-space-between gap-6">
                    <div className="flex flex-column">
                        <div className="block color-hint mb-1">{c('Wallet dashboard').t`Current price`}</div>
                        <div className="w-full grow">
                            <span className={clsx('block', loadingExchangeRate && 'skeleton-loader')}>
                                {exchangeRate && (
                                    <CorePrice currency={exchangeRate.FiatCurrency} divisor={exchangeRate.Cents}>
                                        {exchangeRate?.ExchangeRate}
                                    </CorePrice>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-column">
                        <span className="block color-hint mb-1">{c('Wallet dashboard').t`24h change`}</span>
                        <div className="w-full grow">
                            <span
                                className={clsx(
                                    'block',
                                    loadingExchangeRate && 'skeleton-loader',
                                    percentChange >= 0 ? 'color-success' : 'color-danger'
                                )}
                            >
                                {percentChange.toFixed(2)}%
                            </span>
                        </div>
                    </div>

                    <div style={{ height: '3rem', width: '10rem' }}>
                        <Line
                            id="line-chart"
                            options={lineChartOptions}
                            data={{
                                datasets: [
                                    {
                                        borderColor: window
                                            .getComputedStyle(document.body)
                                            .getPropertyValue('--signal-success'),
                                        borderWidth: 2,
                                        tension: 0,
                                        pointRadius: 0,
                                        data: priceGraphData.GraphData.map((d) => ({
                                            x: d.Timestamp,
                                            y: d.ExchangeRate / d.Cents,
                                        })),
                                    },
                                ],
                                labels: priceGraphData.GraphData.map((d) => d.Timestamp),
                            }}
                        />
                    </div>
                </div>
            </div>

            {isNarrow ? (
                <hr className="w-full my-3" />
            ) : (
                <hr className="metrics-and-ctas-hr-large h-full border-right mx-3 m-0" />
            )}

            <div
                className={clsx(
                    'flex flex-row max-w-custom my-2 flex-nowrap',
                    isNarrow ? 'w-full justify-space-between' : 'justify-center'
                )}
                style={isNarrow ? {} : { '--max-w-custom': '30rem' }}
            >
                <Tooltip
                    title={
                        localDisabled || !canSend
                            ? c('wallet dashboard').t`You need to have a positive balance to send bitcoins`
                            : null
                    }
                >
                    <div className="flex grow">
                        <CtaButton disabled={localDisabled || !canSend} onClick={() => onClickSend()}>{c(
                            'Wallet dashboard'
                        ).t`Send`}</CtaButton>
                    </div>
                </Tooltip>

                <CtaButton disabled={localDisabled} onClick={() => onClickReceive()}>{c('Wallet dashboard')
                    .t`Receive`}</CtaButton>
                <CtaButton disabled={localDisabled} onClick={() => onClickBuy()}>{c('Wallet dashboard')
                    .t`Buy`}</CtaButton>
            </div>
        </div>
    );
};
