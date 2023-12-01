import { useEffect, useMemo, useState } from 'react';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { AccountWithBalanceAndTxs, LightningUriFormat, WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { getLightningFormatOptions } from './constants';

export interface UseBitcoinReceiveInfoGeneratorHelper {
    /**
     * Memoized. Can be either a bitcoin Address, a bitcoin URI, a lightning URI or unified URI (URI containing both bitcoin and lightning needed payment informations)
     */
    serializedPaymentInformation: string | null;
    selectedWallet?: WalletWithAccountsWithBalanceAndTxs;
    walletsOptions: { value: number; label: string; disabled: boolean }[];
    accountsOptions?: { value: number; label: string }[];
    selectedAccount?: AccountWithBalanceAndTxs;
    selectedFormat: {
        name: string;
        value: LightningUriFormat;
    };
    shouldShowAmountInput: boolean;
    amount: number;
    handleSelectWallet: (event: SelectChangeEvent<number>) => void;
    handleSelectAccount: (event: SelectChangeEvent<number>) => void;
    handleSelectFormat: (event: SelectChangeEvent<LightningUriFormat>) => void;
    handleChangeAmount: (amount?: number) => void;
    showAmountInput: () => void;
}

const getSelectedWallet = (
    wallets: WalletWithAccountsWithBalanceAndTxs[],
    walletId?: number
): WalletWithAccountsWithBalanceAndTxs | undefined =>
    wallets.find(({ WalletID }) => walletId === WalletID) ?? wallets[0];

const getDefaultAccount = (wallet?: WalletWithAccountsWithBalanceAndTxs): AccountWithBalanceAndTxs | undefined =>
    wallet?.accounts?.[0];

const getSelectedAccount = (
    wallet?: WalletWithAccountsWithBalanceAndTxs,
    accountId?: number
): AccountWithBalanceAndTxs | undefined =>
    wallet?.accounts?.find?.(({ WalletAccountID }) => WalletAccountID === accountId);

export const useBitcoinReceiveInfoGenerator = (
    wallets: WalletWithAccountsWithBalanceAndTxs[],
    defaultWalletId?: number
): UseBitcoinReceiveInfoGeneratorHelper => {
    const walletsOptions = useMemo(
        () =>
            wallets.map((wallet) => ({
                value: wallet.WalletID,
                label: wallet.Name,
                disabled: !wallet?.accounts?.length,
            })),
        [wallets]
    );

    const defaultWallet = getSelectedWallet(wallets, defaultWalletId);

    const [selectedWallet, setSelectedWallet] = useState(defaultWallet);
    const accountsOptions = useMemo(
        () =>
            selectedWallet?.accounts?.map((account) => ({
                value: account.WalletAccountID,
                label: account.Label,
            })),
        [selectedWallet]
    );

    const [selectedAccount, setSelectedAccount] = useState(getDefaultAccount(selectedWallet));

    const lightningFormats = getLightningFormatOptions();
    const [defaultFormat] = lightningFormats;
    const [selectedFormat, setSelectedFormat] = useState(defaultFormat);

    const [amount, setAmount] = useState(0);
    const [shouldShowAmountInput, setShouldShowAmountInput] = useState(false);

    const serializedPaymentInformation = useMemo(() => {
        if (!selectedAccount || !selectedWallet) {
            return null;
        }

        // TODO: do proper serialized payment info generation for Bitcoin Address/Bitcoin URI/Lightning URI/Unified URI
        return `${selectedWallet.WalletID}${selectedAccount.WalletAccountID}${selectedFormat.value}${amount}zbezbefrzltnzxgzxlhrwaourafhnrizbezbefrzltnzxgzxlhrwaourafhnrizbezbefrzltnzxgzxlhrwaourafhnrizbezbefrzltnzxgzxlhrwaourafhnri`;
    }, [selectedAccount, selectedFormat, selectedWallet, amount]);

    const handleSelectWallet = ({ value }: SelectChangeEvent<number>) => {
        const wallet = getSelectedWallet(wallets, value);
        if (wallet) {
            setSelectedWallet(wallet);
        }
    };

    useEffect(() => {
        setSelectedAccount(getDefaultAccount(selectedWallet));
    }, [selectedWallet]);

    const handleSelectAccount = ({ value }: SelectChangeEvent<number>) => {
        const account = getSelectedAccount(selectedWallet, value);
        if (account) {
            setSelectedAccount(account);
        }
    };

    return {
        serializedPaymentInformation,
        selectedWallet,
        walletsOptions,
        selectedAccount,
        accountsOptions,
        selectedFormat,
        shouldShowAmountInput,
        amount,
        handleSelectWallet,
        handleSelectAccount,
        handleSelectFormat: ({ value }) => {
            setSelectedFormat(lightningFormats.find((format) => format.value === value) ?? defaultFormat);
        },
        showAmountInput: () => setShouldShowAmountInput(true),
        handleChangeAmount: (inputAmount) => {
            const numbered = Number(inputAmount);
            const nonConstrainedAmount = Number.isInteger(numbered) ? numbered : 0;

            if (nonConstrainedAmount < 0) {
                setAmount(0);
            } else {
                setAmount(nonConstrainedAmount);
            }
        },
    };
};
