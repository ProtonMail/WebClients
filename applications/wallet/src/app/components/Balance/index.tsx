import { useRef } from 'react';

import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { Icon } from '@proton/components';
import type { IWasmApiWalletData } from '@proton/wallet';
import { COMPUTE_BITCOIN_UNIT } from '@proton/wallet';
import {
    toggleHideAmounts,
    useHideAmounts,
    useUserWalletSettings,
    useWalletAccountExchangeRate,
    useWalletDispatch,
} from '@proton/wallet/store';

import { CoreButton } from '../../atoms';
import { MaybeHiddenAmount } from '../../atoms/MaybeHiddenAmount';
import { Price } from '../../atoms/Price';
import { Skeleton } from '../../atoms/Skeleton';
import { useBitcoinBlockchainContext } from '../../contexts';
import { convertAmountStr, getLabelByUnit } from '../../utils';
import { useBalance } from './useBalance';

import './Balance.scss';

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    disabled?: boolean;
}

export const Balance = ({ apiWalletData, apiAccount, disabled }: Props) => {
    const dispatch = useWalletDispatch();
    const hideAmounts = useHideAmounts();

    const [settings] = useUserWalletSettings();
    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(
        apiAccount ?? apiWalletData.WalletAccounts[0]
    );

    const { getSyncingData } = useBitcoinBlockchainContext();

    const syncingData = getSyncingData(apiWalletData.Wallet.ID, apiAccount?.ID);

    const balanceRef = useRef<HTMLDivElement>(null);

    const { balance } = useBalance(apiWalletData, apiAccount);

    const loadingBalance = Boolean((syncingData?.syncing || syncingData?.error) && !balance);

    return (
        <div className="wallet-balance flex flex-row flex-nowrap py-2 px-0 m-4 items-center">
            <div key={apiWalletData.Wallet.ID} ref={balanceRef} className="flex flex-column">
                <div className="text-lg color-hint">
                    {apiAccount ? apiAccount.Label : c('Wallet dashboard').t`All accounts`}
                </div>
                <div className="flex flex-row flex-nowrap items-center my-1">
                    <Skeleton
                        loading={loadingExchangeRate || loadingBalance}
                        placeholder={<div className="h1 text-semibold">{c('Balance').t`Loading balance`}</div>}
                    >
                        <Price
                            className="h1 text-semibold"
                            wrapperClassName="contrast"
                            unit={exchangeRate ?? settings.BitcoinUnit}
                            amount={disabled ? '--' : balance}
                        />
                    </Skeleton>

                    {!disabled && (
                        <CoreButton
                            shape="ghost"
                            pill
                            icon
                            className="ml-2 shrink-0"
                            aria-pressed={hideAmounts}
                            onClick={() => dispatch(toggleHideAmounts())}
                        >
                            <Icon name={hideAmounts ? 'eye' : 'eye-slash'} alt={c('Action').t`Show balance`} size={6} />
                        </CoreButton>
                    )}
                </div>
                {!loadingExchangeRate && exchangeRate && !disabled && (
                    <Skeleton
                        loading={loadingBalance}
                        placeholder={<div className="text-lg">{c('Balance').t`Loading balance`}</div>}
                    >
                        <div className="text-lg color-hint">
                            <MaybeHiddenAmount>
                                {convertAmountStr(balance, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}
                            </MaybeHiddenAmount>{' '}
                            {getLabelByUnit(settings.BitcoinUnit)}
                        </div>
                    </Skeleton>
                )}
            </div>
        </div>
    );
};
