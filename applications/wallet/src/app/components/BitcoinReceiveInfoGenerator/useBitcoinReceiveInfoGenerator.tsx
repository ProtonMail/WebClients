import { useMemo, useState } from 'react';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { Account, LightningUriFormat, Wallet } from '../../types';
import { getLightningFormatOptions } from './constants';

export interface UseBitcoinReceiveInfoGeneratorHelper {
    /**
     * Memoized. Can be either a bitcoin Address, a bitcoin URI, a lightning URI or unified URI (URI containing both bitcoin and lightning needed payment informations)
     */
    serializedPaymentInformation: string;
    selectedWallet: Wallet;
    selectedAccount: Account;
    selectedFormat: {
        name: string;
        value: LightningUriFormat;
    };
    shouldShowAmountInput: boolean;
    amount: number;
    handleSelectWallet: (event: SelectChangeEvent<string>) => void;
    handleSelectAccount: (event: SelectChangeEvent<string>) => void;
    handleSelectFormat: (event: SelectChangeEvent<LightningUriFormat>) => void;
    handleChangeAmount: (amount?: number) => void;
    showAmountInput: () => void;
}

export const useBitcoinReceiveInfoGenerator = (
    wallets: Wallet[],
    accounts: Account[],
    defaultWalletId?: string
): UseBitcoinReceiveInfoGeneratorHelper => {
    const defaultWallet = wallets.find(({ id }) => defaultWalletId === id) ?? wallets[0];
    const [selectedWallet, setSelectedWallet] = useState(defaultWallet);
    const [selectedAccount, setSelectedAccount] = useState(accounts[0]);

    const lightningFormats = getLightningFormatOptions();
    const [defaultFormat] = lightningFormats;
    const [selectedFormat, setSelectedFormat] = useState(defaultFormat);

    const [amount, setAmount] = useState(0);
    const [shouldShowAmountInput, setShouldShowAmountInput] = useState(false);

    const serializedPaymentInformation = useMemo(() => {
        // TODO: do proper serialized payment info generation for Bitcoin Address/Bitcoin URI/Lightning URI/Unified URI
        return `${selectedWallet.id}${selectedAccount.id}${selectedFormat.value}${amount}zbezbefrzltnzxgzxlhrwaourafhnrizbezbefrzltnzxgzxlhrwaourafhnrizbezbefrzltnzxgzxlhrwaourafhnrizbezbefrzltnzxgzxlhrwaourafhnri`;
    }, [selectedAccount.id, selectedFormat.value, selectedWallet.id, amount]);

    return {
        serializedPaymentInformation,
        selectedWallet,
        selectedAccount,
        selectedFormat,
        shouldShowAmountInput,
        amount,
        handleSelectWallet: ({ value }) => {
            const wallet = wallets.find(({ id }) => id === value);
            if (wallet) {
                setSelectedWallet(wallet);
            }
        },
        handleSelectAccount: ({ value }) => {
            const account = accounts.find(({ id }) => id === value);
            if (account) {
                setSelectedAccount(account);
            }
        },
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
