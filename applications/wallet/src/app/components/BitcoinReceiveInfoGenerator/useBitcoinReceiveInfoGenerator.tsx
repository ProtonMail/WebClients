import { useMemo, useState } from 'react';

import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';

import { LightningUriFormat } from '../../types';
import { getLightningFormatOptions } from './constants';

const wallets: any[] = [
    { kind: 'lightning', name: 'lightning 01', id: 0, balance: 167 },
    { kind: 'bitcoin', name: 'Bitcoin 01', id: 1, balance: 1783999 },
];

const accounts: any[] = [
    { name: 'account #1', id: 0 },
    { name: 'account #2', id: 1 },
    { name: 'account #3', id: 2 },
];

export interface UseBitcoinReceiveInfoGeneratorHelper {
    /**
     * Memoized. Can be either a bitcoin Address, a bitcoin URI, a lightning URI or unified URI (URI containing both bitcoin and lightning needed payment informations)
     */
    serializedPaymentInformation: string;
    selectedWallet: any;
    selectedAccount: any;
    selectedFormat: any;
    shouldShowAmountInput: boolean;
    amount: number;
    handleSelectWallet: (event: SelectChangeEvent<number>) => void;
    handleSelectAccount: (event: SelectChangeEvent<number>) => void;
    handleSelectFormat: (event: SelectChangeEvent<LightningUriFormat>) => void;
    handleChangeAmount: (amount?: number) => void;
    showAmountInput: () => void;
}

export const useBitcoinReceiveInfoGenerator = (): UseBitcoinReceiveInfoGeneratorHelper => {
    const [selectedWallet, setSelectedWallet] = useState(wallets[0]);
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
            setSelectedWallet(wallets.find(({ id }) => id === value));
        },
        handleSelectAccount: ({ value }) => {
            setSelectedAccount(accounts.find(({ id }) => id === value));
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
                // TODO: maybe do this for account level on onchain wallets
            } else if (nonConstrainedAmount > selectedWallet.balance) {
                setAmount(selectedWallet.balance);
            } else {
                setAmount(nonConstrainedAmount);
            }
        },
    };
};
