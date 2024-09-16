import type { ReactNode } from 'react';
import { Line } from 'react-chartjs-2';

import { type ChartOptions } from 'chart.js';
import first from 'lodash/first';
import last from 'lodash/last';
import { c } from 'ttag';

import type { WasmApiWalletAccount, WasmPriceGraph } from '@proton/andromeda';
import { Tooltip } from '@proton/components';
import btcSvg from '@proton/styles/assets/img/illustrations/btc.svg';
import clsx from '@proton/utils/clsx';
import { BITCOIN, DEFAULT_FIAT_CURRENCY, type IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton } from '../../atoms/Button';
import { Price } from '../../atoms/Price';
import { Skeleton } from '../../atoms/Skeleton';
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

const getPercentChange = (graphData: WasmPriceGraph['GraphData']) => {
    const firstDataPoint = first(graphData)?.ExchangeRate;
    const absoluteChange = (last(graphData)?.ExchangeRate ?? 0) - (firstDataPoint ?? 0);
    return firstDataPoint ? (absoluteChange / firstDataPoint) * 100 : 0;
};

export const MetricsAndCtas = ({
    apiAccount,
    apiWalletData,
    disabled,
    onClickSend,
    onClickReceive,
    onClickBuy,
}: Props) => {
    const account = apiAccount ?? apiWalletData.WalletAccounts.at(0);
    const localDisabled = !account || disabled;
    const { isNarrow } = useResponsiveContainerContext();

    const { totalBalance } = useBalance(apiWalletData, apiAccount);

    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(account);
    const [priceGraphData = { GraphData: [] }, loadingGraphData] = usePriceGraphData(
        account?.FiatCurrency ?? DEFAULT_FIAT_CURRENCY,
        'OneDay'
    );

    const percentChange = getPercentChange(priceGraphData.GraphData);

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
                'metrics-and-ctas flex gap-4 bg-weak rounded-2xl justify-space-between',
                isNarrow ? 'flex-column items-start p-4 mx-2 my-4' : 'flex-row items-center p-6 m-4'
            )}
        >
            <div className="flex flex-row gap-6 max-w-custom my-2 items-center" style={{ '--max-w-custom': '50rem' }}>
                <div className="flex gap-4 flex-nowrap items-center">
                    <img src={btcSvg} alt={c('Info').t`Bitcoin`} />
                    <span className="metrics-and-ctas-btc-text">
                        <span>{c('Info').t`Bitcoin`}</span> <span className="color-weak">BTC</span>
                    </span>
                </div>

                <div className="flex flex-row justify-space-between gap-6">
                    <div className="flex flex-column text-right">
                        <div className="block color-hint mb-1">{c('Wallet dashboard').t`Current price`}</div>
                        <div className="w-full grow">
                            <Skeleton
                                loading={loadingExchangeRate}
                                placeholder={<span className="block">{c('Loader').t`Loading`}</span>}
                            >
                                <span className="block">
                                    {exchangeRate && <Price unit={exchangeRate} satsAmount={1 * BITCOIN} />}
                                </span>
                            </Skeleton>
                        </div>
                    </div>

                    <div className="flex-column text-right">
                        <span className="block color-hint mb-1">{c('Wallet dashboard').t`24h change`}</span>
                        <div className="w-full grow">
                            <Skeleton
                                loading={loadingGraphData}
                                placeholder={<span className="block">{c('Loader').t`Loading`}</span>}
                            >
                                <span className={clsx('block', percentChange >= 0 ? 'color-success' : 'color-danger')}>
                                    {percentChange.toFixed(2)}%
                                </span>
                            </Skeleton>
                        </div>
                    </div>

                    <div className="metrics-and-ctas-chart" style={{ height: '3rem', width: '8rem' }}>
                        <Line
                            id="line-chart"
                            options={lineChartOptions}
                            data={{
                                datasets: [
                                    {
                                        borderColor: window
                                            .getComputedStyle(document.body)
                                            .getPropertyValue(
                                                percentChange < 0 ? '--signal-danger' : '--signal-success'
                                            ),
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
                <hr className="metrics-and-ctas-hr-large h-full border-right m-0" />
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
                        !canSend ? c('wallet dashboard').t`You need to have a positive balance to send bitcoins` : null
                    }
                >
                    <CtaButton disabled={localDisabled || !canSend} onClick={() => onClickSend()}>{c('Wallet dashboard')
                        .t`Send`}</CtaButton>
                </Tooltip>

                <CtaButton disabled={localDisabled} onClick={() => onClickReceive()}>{c('Wallet dashboard')
                    .t`Receive`}</CtaButton>
                <CtaButton disabled={localDisabled} onClick={() => onClickBuy()}>{c('Wallet dashboard')
                    .t`Buy`}</CtaButton>
            </div>
        </div>
    );
};
