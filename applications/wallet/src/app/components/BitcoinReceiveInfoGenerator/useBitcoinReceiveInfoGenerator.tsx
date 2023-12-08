import { useEffect, useMemo, useState } from 'react';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { AccountWithBlockchainData, LightningUriFormat, WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { WalletType } from '../../types/api';
import { getDefaultAccount, getSelectedAccount, getSelectedWallet } from '../../utils';
import { getLightningFormatOptions } from './constants';

export interface UseBitcoinReceiveInfoGeneratorHelper {
    /**
     * Memoized. Can be either a bitcoin Address, a bitcoin URI, a lightning URI or unified URI (URI containing both bitcoin and lightning needed payment informations)
     */
    serializedPaymentInformation: string | null;
    selectedWallet?: WalletWithAccountsWithBalanceAndTxs;
    walletsOptions: { value: number; label: string; disabled: boolean }[];
    accountsOptions?: { value: number; label: string }[];
    selectedAccount?: AccountWithBlockchainData;
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

    const serializedPaymentInformation = useMemo(() => {
        if (!selectedAccount || !selectedWallet) {
            return null;
        }

        if (selectedWallet.Type === WalletType.OnChain) {
            return selectedAccount.wasmAccount.get_bitcoin_uri(undefined, amount ? BigInt(amount) : undefined);
        }

        return '';
    }, [selectedAccount, selectedWallet, amount]);

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
