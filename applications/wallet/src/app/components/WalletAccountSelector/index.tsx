import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import type { WasmApiWallet, WasmApiWalletAccount } from '@proton/andromeda';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import Icon from '@proton/components/components/icon/Icon';
import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import clsx from '@proton/utils/clsx';
import { COMPUTE_BITCOIN_UNIT } from '@proton/wallet';
import { useUserWalletSettings, useWalletAccountExchangeRate } from '@proton/wallet/store';

import { Price } from '../../atoms/Price';
import { Skeleton } from '../../atoms/Skeleton';
import { useBitcoinBlockchainContext } from '../../contexts';
import type { AccountWithChainData } from '../../types';
import {
    convertAmountStr,
    getAccountBalance,
    getAccountWithChainDataFromManyWallets,
    getLabelByUnit,
} from '../../utils';

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
            <Skeleton
                loading={loadingExchangeRate}
                placeholder={<span className="block">{c('Wallet transaction').t`Loading balance`}</span>}
            >
                <div className="ml-auto flex flex-row flex-nowrap justify-end">
                    <Price unit={exchangeRate ?? settings.BitcoinUnit} amount={balance} />
                </div>
            </Skeleton>

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
    withIcon = false,
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
        <div className="flex flex-row w-full flex-nowrap justify-space-between items-center text-sm gap-4">
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

interface Props {
    value: [WasmApiWallet, WasmApiWalletAccount];
    onSelect: (selected: [WasmApiWallet, WasmApiWalletAccount]) => void;
    checkIsValid?: ValidAccountChecker;
    options: [WasmApiWallet, WasmApiWalletAccount[]][];
    disabled?: boolean;
    doNotShowInvalidWalletAccounts?: boolean;
}

interface CheckedAccount {
    walletAccount: WasmApiWalletAccount;
    accountChainData: AccountWithChainData;
    isValid: true;
}

export const WalletAccountSelector = ({
    value,
    options: inputOptions,
    disabled,
    checkIsValid,
    onSelect,
    doNotShowInvalidWalletAccounts,
}: Props) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const { walletsChainData } = useBitcoinBlockchainContext();

    const [wallet, account] = value;
    const selectedAccountChainData = getAccountWithChainDataFromManyWallets(
        walletsChainData,
        account.WalletID,
        account.ID
    );

    const [checkedOptions, setCheckedOptions] = useState<[WasmApiWallet, CheckedAccount[]][]>([]);

    useEffect(() => {
        const fetchAllValidAccounts = async () => {
            const checkedAccountAndWallet = await Promise.all(
                inputOptions.map(async ([wallet, walletAccounts]) => {
                    const accounts = await Promise.all(
                        walletAccounts.map(async (walletAccount) => {
                            const accountChainData = getAccountWithChainDataFromManyWallets(
                                walletsChainData,
                                walletAccount.WalletID,
                                walletAccount.ID
                            );

                            return {
                                walletAccount,
                                accountChainData,
                                isValid: checkIsValid
                                    ? await checkIsValid(wallet, walletAccount, accountChainData)
                                    : true,
                            };
                        })
                    );

                    return [wallet, accounts] as [WasmApiWallet, CheckedAccount[]];
                })
            );

            setCheckedOptions(checkedAccountAndWallet);
        };

        void fetchAllValidAccounts();
    }, [inputOptions, walletsChainData, checkIsValid]);

    const validOptions = useMemo(() => {
        return checkedOptions
            .map(
                ([w, a]) =>
                    [w, a.filter((a) => !doNotShowInvalidWalletAccounts || a.isValid)] as [
                        WasmApiWallet,
                        CheckedAccount[],
                    ]
            )
            .filter(([, a]) => a.length);
    }, [checkedOptions, doNotShowInvalidWalletAccounts]);

    const onlyHasOneWalletWithOneAccount = validOptions.length === 1 && validOptions[0][1].length === 1;

    if (onlyHasOneWalletWithOneAccount) {
        // check if the selected account is the single valid account
        const { walletAccount } = validOptions[0][1][0];
        if (account.ID !== walletAccount.ID) {
            onSelect([wallet, walletAccount]);
        }
        return (
            <div className="border rounded-xl bg-weak py-5 px-4 w-full">
                <div className="flex flex-column">
                    <div className="flex flex-row flex-nowrap w-full justify-space-between items-center mb-3">
                        <div className="text-semibold text-ellipsis">{wallet.Name}</div>
                    </div>

                    <WalletAccountItem
                        walletAccount={account}
                        accountChainData={selectedAccountChainData}
                        withIcon={false}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <DropdownButton
                ref={anchorRef}
                isOpen={isOpen}
                onClick={toggle}
                className="border rounded-xl bg-weak py-5 w-full"
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
                    {validOptions.map(([wallet, walletAccounts]) => {
                        return (
                            <div key={wallet.ID}>
                                <div className="flex flex-row items-center p-4">
                                    <div className="text-semibold">{wallet.Name}</div>
                                </div>

                                {walletAccounts.map(({ walletAccount, accountChainData, isValid }) => (
                                    <DropdownMenuButton
                                        onClick={() => onSelect([wallet, walletAccount])}
                                        className="text-left"
                                        disabled={!isValid}
                                    >
                                        <WalletAccountItem
                                            walletAccount={walletAccount}
                                            accountChainData={accountChainData}
                                            withIcon={false}
                                        />
                                    </DropdownMenuButton>
                                ))}
                            </div>
                        );
                    })}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
