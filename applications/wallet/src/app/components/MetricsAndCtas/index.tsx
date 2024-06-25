import { ReactNode, useEffect, useState } from 'react';

import { sub } from 'date-fns';
import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { SECOND } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import btcSvg from '@proton/styles/assets/img/illustrations/btc.svg';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton } from '../../atoms/Button';
import { CorePrice } from '../../atoms/Price';
import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';
import { useWalletAccountExchangeRate } from '../../hooks/useWalletAccountExchangeRate';
import { useGetExchangeRate } from '../../store/hooks';

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    disabled?: boolean;
    onClickSend: () => void;
    onClickReceive: () => void;
}

export const MetricsAndCtas = ({ apiAccount, apiWalletData, disabled, onClickSend, onClickReceive }: Props) => {
    const account = apiAccount ?? apiWalletData.WalletAccounts[0];
    const localDisabled = !account || disabled;
    const { isNarrow } = useResponsiveContainerContext();

    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(account);

    const [twentyFourHourChange, setTwentyFourHourChange] = useState<number>();

    const getExchangeRate = useGetExchangeRate();

    useEffect(() => {
        const yesterday = sub(new Date(Number(exchangeRate?.ExchangeRateTime) * SECOND), { days: 1 });

        if (account?.FiatCurrency && exchangeRate?.ExchangeRate && !loadingExchangeRate) {
            const fetch = async () => {
                // This is needed because promiseCache directly returns promise if still pending
                await wait(1);
                await getExchangeRate(account?.FiatCurrency, yesterday).then((prevExchangeRate) => {
                    if (prevExchangeRate) {
                        const absoluteChange = exchangeRate.ExchangeRate - prevExchangeRate?.ExchangeRate;
                        const relativeChange = absoluteChange / prevExchangeRate.ExchangeRate;
                        setTwentyFourHourChange(relativeChange * 100);
                    }
                });
            };

            void fetch();
        }
    }, [account?.FiatCurrency, exchangeRate, getExchangeRate, loadingExchangeRate]);

    const commonProps = {
        className: 'text-lg w-custom mx-1 rounded-full grow',
        style: { '--w-custom': isNarrow ? '5rem' : '7.5rem' },
        disabled: localDisabled,
    };

    const CtaButton = (props: { children: ReactNode; onClick?: () => void }) =>
        isNarrow ? (
            <CoreButton shape="ghost" color="weak" {...commonProps} {...props} />
        ) : (
            <Button shape="solid" color="norm" {...commonProps} {...props} />
        );

    return (
        <div
            className={clsx(
                'flex bg-weak rounded-xl justify-space-between',
                isNarrow ? 'flex-column items-start p-4 mx-2 my-4' : 'flex-row items-center p-6 m-4'
            )}
        >
            <div
                className="flex flex-row max-w-custom my-2 items-center"
                style={{ flexGrow: '1', '--max-w-custom': '50rem' }}
            >
                <div className="mr-3">
                    <img src={btcSvg} alt="Bitcoin logo" />
                </div>

                <div className="flex flex-row justify-space-between gap-3">
                    <div className="flex flex-column mx-1">
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
                </div>
            </div>

            {isNarrow && <hr className="w-full my-3" />}

            <div
                className={clsx(
                    'flex flex-row max-w-custom my-2 flex-nowrap',
                    isNarrow ? 'w-full justify-space-between' : 'justify-center mx-auto'
                )}
                style={isNarrow ? {} : { '--max-w-custom': '30rem' }}
            >
                <CtaButton onClick={() => onClickSend()}>{c('Wallet dashboard').t`Send`}</CtaButton>
                <CtaButton onClick={() => onClickReceive()}>{c('Wallet dashboard').t`Receive`}</CtaButton>
                <CtaButton>{c('Wallet dashboard').t`Buy`}</CtaButton>
            </div>
        </div>
    );
};
