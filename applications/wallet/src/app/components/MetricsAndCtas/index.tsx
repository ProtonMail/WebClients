import { useEffect, useState } from 'react';

import { sub } from 'date-fns';
import { c } from 'ttag';

import { Price } from '@proton/components/components';
import { SECOND } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import { useWalletSettings } from '@proton/wallet';

import { Button } from '../../atoms/Button';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useUserExchangeRate } from '../../hooks/useUserExchangeRate';
import { useGetExchangeRate } from '../../store/hooks';
import { satsToFiat } from '../../utils';
import btcSvg from '@proton/styles/assets/img/illustrations/btc.svg';

interface Props {
    disabled?: boolean;
    onClickSend: () => void;
    onClickReceive: () => void;
}

export const MetricsAndCtas = ({ disabled, onClickSend, onClickReceive }: Props) => {
    const [walletSettings] = useWalletSettings();
    const [exchangeRate, loadingExchangeRate] = useUserExchangeRate();
    const [twentyFourHourChange, setTwentyFourHourChange] = useState<number>();
    const { feesEstimation, loadingFeesEstimation } = useBitcoinBlockchainContext();

    const getExchangeRate = useGetExchangeRate();

    useEffect(() => {
        const yesterday = sub(new Date(Number(exchangeRate?.ExchangeRateTime) * SECOND), { days: 1 });

        if (walletSettings?.FiatCurrency && exchangeRate?.ExchangeRate) {
            void getExchangeRate(walletSettings?.FiatCurrency, yesterday).then((prevExchangeRate) => {
                if (prevExchangeRate) {
                    const absoluteChange = exchangeRate.ExchangeRate - prevExchangeRate?.ExchangeRate;
                    const relativeChange = absoluteChange / prevExchangeRate.ExchangeRate;
                    setTwentyFourHourChange(relativeChange * 100);
                }
            });
        }
    }, [walletSettings?.FiatCurrency, exchangeRate, getExchangeRate]);

    return (
        <div className="flex flex-row py-6 px-6 m-4 bg-weak rounded-xl items-center justify-space-between">
            <div
                className="flex flex-row max-w-custom my-2 items-center"
                style={{ flexGrow: '1', '--max-w-custom': '50rem' }}
            >
                <div className="mr-3">
                    <img src={btcSvg} alt="Bitcoin logo" />
                </div>

                <div className="flex flex-row justify-space-between grow">
                    <div className="flex flex-column mx-1">
                        <div className="block color-hint mb-1">{c('Wallet dashboard').t`Current price`}</div>
                        <div className="w-full grow">
                            <span className={clsx('block', loadingExchangeRate && 'skeleton-loader')}>
                                {exchangeRate && (
                                    <Price currency={exchangeRate.FiatCurrency}>{exchangeRate?.ExchangeRate}</Price>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-column mx-1">
                        <span className="block color-hint mb-1">{c('Wallet dashboard').t`24h change`}</span>
                        <div className="w-full grow">
                            <span className={clsx('block', loadingExchangeRate && 'skeleton-loader')}>
                                {Number.isFinite(twentyFourHourChange) && (
                                    <span
                                        className={clsx(
                                            'block',
                                            (twentyFourHourChange ?? 0) >= 0 ? 'color-success' : 'color-danger'
                                        )}
                                    >
                                        {twentyFourHourChange ? twentyFourHourChange.toFixed(2) : 0}%
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-column mx-1">
                        <span className="block color-hint mb-1">{c('Wallet dashboard').t`Next block fees`}</span>
                        <div className="w-full grow">
                            <span className={clsx('block', loadingFeesEstimation && 'skeleton-loader')}>
                                {exchangeRate && (
                                    <Price currency={exchangeRate.FiatCurrency} divisor={1}>
                                        {satsToFiat((feesEstimation.get('1') ?? 1) * 141, exchangeRate)}
                                    </Price>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-column mx-1">
                        <span className="block color-hint mb-1">{c('Wallet dashboard').t`Next block`}</span>
                        <span className="block">-</span>
                    </div>
                </div>
            </div>

            <div className="flex" style={{ flexGrow: '1' }}>
                <div className="h-custom border-left mx-auto" style={{ '--h-custom': '2.5rem' }} />
            </div>

            <div
                className="flex flex-row justify-center max-w-custom justify-center mx-auto my-2"
                style={{ '--max-w-custom': '30rem' }}
            >
                <Button
                    shape="solid"
                    color="norm"
                    className="text-lg w-custom mx-1"
                    style={{ '--w-custom': '7.5rem' }}
                    onClick={() => onClickSend()}
                    disabled={disabled}
                >
                    {c('Wallet dashboard').t`Send`}
                </Button>

                <Button
                    shape="solid"
                    color="norm"
                    className="text-lg w-custom mx-1"
                    style={{ '--w-custom': '7.5rem' }}
                    onClick={() => onClickReceive()}
                    disabled={disabled}
                >
                    {c('Wallet dashboard').t`Receive`}
                </Button>

                <Button
                    shape="solid"
                    color="norm"
                    className="text-lg w-custom mx-1"
                    style={{ '--w-custom': '7.5rem' }}
                    disabled={disabled}
                >
                    {c('Wallet dashboard').t`Buy`}
                </Button>
            </div>
        </div>
    );
};
