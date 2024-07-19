import { useRef } from 'react';

import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { Icon } from '@proton/components/components';
import { useToggle } from '@proton/components/hooks';
import clsx from '@proton/utils/clsx';
import type { IWasmApiWalletData } from '@proton/wallet';
import { COMPUTE_BITCOIN_UNIT, useUserWalletSettings } from '@proton/wallet';

import { CoreButton } from '../../atoms';
import { Price } from '../../atoms/Price';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletAccountExchangeRate } from '../../hooks/useWalletAccountExchangeRate';
import { convertAmountStr, getLabelByUnit } from '../../utils';
import { useBalance } from './useBalance';

import './Balance.scss';

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
}

export const Balance = ({ apiWalletData, apiAccount }: Props) => {
    const [settings] = useUserWalletSettings();
    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(
        apiAccount ?? apiWalletData.WalletAccounts[0]
    );

    const { getSyncingData } = useBitcoinBlockchainContext();

    const syncingData = getSyncingData(apiWalletData.Wallet.ID, apiAccount?.ID);

    const balanceRef = useRef<HTMLDivElement>(null);
    const { state: showBalance, toggle: toggleShowBalance } = useToggle(true);

    const { totalBalance } = useBalance(apiWalletData, apiAccount);

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

                    <CoreButton
                        shape="ghost"
                        pill
                        icon
                        className="ml-2 shrink-0"
                        aria-pressed={showBalance}
                        onClick={() => toggleShowBalance()}
                    >
                        <Icon name={showBalance ? 'eye-slash' : 'eye'} alt={c('Action').t`Show balance`} size={6} />
                    </CoreButton>
                </div>
                {!loadingExchangeRate && exchangeRate && (
                    <div
                        className={clsx(
                            'text-lg color-hint',
                            syncingData?.syncing && !totalBalance && 'skeleton-loader'
                        )}
                    >
                        <span className={clsx(!showBalance && 'blurred')}>
                            {convertAmountStr(totalBalance, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                        </span>
                        {getLabelByUnit(settings.BitcoinUnit)}
                    </div>
                )}
            </div>
        </div>
    );
};
