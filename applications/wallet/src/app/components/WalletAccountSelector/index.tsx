import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmApiWallet, WasmApiWalletAccount } from '@proton/andromeda';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import clsx from '@proton/utils/clsx';

import { Price } from '../../atoms/Price';
import { COMPUTE_BITCOIN_UNIT } from '../../constants';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletAccountExchangeRate } from '../../hooks/useWalletAccountExchangeRate';
import { useUserWalletSettings } from '../../store/hooks/useUserWalletSettings';
import { AccountWithChainData } from '../../types';
import {
    convertAmountStr,
    getAccountBalance,
    getAccountWithChainDataFromManyWallets,
    getLabelByUnit,
} from '../../utils';
import { useAsyncValue } from '../../utils/hooks/useAsyncValue';

type ValidAccountChecker = (
    wallet: WasmApiWallet,
    account: WasmApiWalletAccount,
    accountChainData?: AccountWithChainData
) => Promise<boolean>;

const WalletAccountBalance = ({ walletAccount, balance }: { walletAccount: WasmApiWalletAccount; balance: number }) => {
    const [exchangeRate, loadingExchangeRate] = useWalletAccountExchangeRate(walletAccount);
    const [settings] = useUserWalletSettings();

    return (
        <div className="shrink-0">
            <div
                className={clsx(
                    'ml-auto flex flex-row flex-nowrap justify-end',
                    loadingExchangeRate && 'skeleton-loader'
                )}
            >
                {!loadingExchangeRate ? (
                    <Price unit={exchangeRate ?? settings.BitcoinUnit} satsAmount={balance} />
                ) : (
                    <span>{c('Wallet transaction').t`Loading`}</span>
                )}
            </div>
            {(loadingExchangeRate || exchangeRate) && (
                <div className={clsx('block ml-auto color-hint flex flex-row flex-nowrap justify-end')}>
                    {convertAmountStr(balance, COMPUTE_BITCOIN_UNIT, settings.BitcoinUnit)}{' '}
                    {getLabelByUnit(settings.BitcoinUnit)}
                </div>
            )}
        </div>
    );
};

export const WalletAccountItem = ({
    withIcon = true,
    walletAccount,
    accountChainData,
}: {
    withIcon?: boolean;
    walletAccount: WasmApiWalletAccount;
    accountChainData: AccountWithChainData | undefined;
}) => {
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        void getAccountBalance(accountChainData).then((b) => setBalance(b));
    }, [accountChainData]);

    return (
        <div className="flex flex-row w-full flex-nowrap justify-space-between items-center text-sm">
            <div className="flex flex-row flex-nowrap items-center">
                {withIcon && <Icon name={'brand-bitcoin'} className="mr-1 shrink-0" />}
                <div style={{ whiteSpace: 'nowrap' }} className="overflow-hidden text-ellipsis">
                    {walletAccount.Label}
                </div>
            </div>

            <WalletAccountBalance walletAccount={walletAccount} balance={balance} />
        </div>
    );
};

const DropdownButtonWalletAccountButton = ({
    wallet,
    walletAccount,
    checkIsValid,
    onClick,
}: {
    wallet: WasmApiWallet;
    walletAccount: WasmApiWalletAccount;
    checkIsValid?: ValidAccountChecker;
    onClick: () => void;
}) => {
    const { walletsChainData } = useBitcoinBlockchainContext();
    const accountChainData = getAccountWithChainDataFromManyWallets(
        walletsChainData,
        walletAccount.WalletID,
        walletAccount.ID
    );

    const promiseIsValid = checkIsValid ? checkIsValid(wallet, walletAccount, accountChainData) : Promise.resolve(true);
    const isValid = useAsyncValue(promiseIsValid, true);

    return (
        <DropdownMenuButton
            onClick={() => onClick()}
            className={clsx('text-left', !isValid && 'color-danger')}
            disabled={!isValid}
        >
            <WalletAccountItem walletAccount={walletAccount} accountChainData={accountChainData} />
        </DropdownMenuButton>
    );
};

interface Props {
    value: [WasmApiWallet, WasmApiWalletAccount];
    onSelect: (selected: [WasmApiWallet, WasmApiWalletAccount]) => void;
    checkIsValid?: ValidAccountChecker;
    options: [WasmApiWallet, WasmApiWalletAccount[]][];
    disabled?: boolean;
}

export const WalletAccountSelector = ({ value, options, disabled, checkIsValid, onSelect }: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { walletsChainData } = useBitcoinBlockchainContext();

    const [wallet, account] = value;
    const selectedAccountChainData = getAccountWithChainDataFromManyWallets(
        walletsChainData,
        account.WalletID,
        account.ID
    );

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                className="border rounded-xl bg-weak py-5 w-custom"
                style={{ '--w-custom': '16rem' }}
                disabled={disabled}
            >
                <div className="flex flex-column">
                    <div className="flex flex-row flex-nowrap w-full justify-space-between items-center mb-3">
                        <div className="text-semibold text-ellipsis">{wallet.Name}</div>
                        <div>
                            <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} />
                        </div>
                    </div>

                    <WalletAccountItem walletAccount={account} accountChainData={selectedAccountChainData} />
                </div>
            </DropdownButton>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
                className="rounded-xl"
                size={{ width: DropdownSizeUnit.Anchor }}
            >
                <DropdownMenu>
                    {options.map(([wallet, walletAccounts]) => {
                        return (
                            <div key={wallet.ID}>
                                <div className="flex flex-row items-center p-4">
                                    <div className="text-semibold">{wallet.Name}</div>
                                </div>

                                {walletAccounts.map((walletAccount) => (
                                    <DropdownButtonWalletAccountButton
                                        onClick={() => onSelect([wallet, walletAccount])}
                                        wallet={wallet}
                                        walletAccount={walletAccount}
                                        checkIsValid={checkIsValid}
                                        key={walletAccount.ID}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
