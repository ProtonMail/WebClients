import { useEffect, useState } from 'react';

import { WasmPaymentLink } from '@proton/andromeda';

import { WalletAndAccountSelectorValue, getDefaultFormat } from '../../atoms';
import { useBitcoinBlockchainContext } from '../../contexts';
import { IWasmApiWalletData } from '../../types';
import { WalletType } from '../../types/api';
import { getAccountWithChainDataFromManyWallets, getDefaultAccount, getSelectedWallet } from '../../utils';

export interface UseBitcoinReceiveHelper {
    /**
     * Memoized. Can be either a bitcoin Address, a bitcoin URI, a lightning URI or unified URI (URI containing both bitcoin and lightning needed payment informations)
     */
    paymentLink: WasmPaymentLink | null;
    selectedWallet: WalletAndAccountSelectorValue;
    shouldShowAmountInput: boolean;
    amount: number;
    handleSelectWallet: (value: WalletAndAccountSelectorValue) => void;
    handleChangeAmount: (amount?: number) => void;
    showAmountInput: () => void;
}

export const useBitcoinReceive = (wallets: IWasmApiWalletData[], defaultWalletId?: string): UseBitcoinReceiveHelper => {
    const [paymentLink, setPaymentLink] = useState<WasmPaymentLink | null>(null);

    const { walletsChainData } = useBitcoinBlockchainContext();

    const defaultWallet = getSelectedWallet(wallets, defaultWalletId);

    const [selectedWallet, setSelectedWallet] = useState<WalletAndAccountSelectorValue>({
        apiWalletData: defaultWallet,
        apiAccount: getDefaultAccount(defaultWallet),
        format: getDefaultFormat().value,
    });

    const [amount, setAmount] = useState(0);
    const [shouldShowAmountInput, setShouldShowAmountInput] = useState(false);

    const handleSelectWallet = (value: WalletAndAccountSelectorValue) => {
        setSelectedWallet((prev) => ({ ...prev, ...value }));
    };

    useEffect(() => {
        setSelectedWallet((prev) => ({ ...prev, apiAccount: getDefaultAccount(selectedWallet.apiWalletData) }));
    }, [selectedWallet.apiWalletData]);

    useEffect(() => {
        const { apiAccount: account, apiWalletData: wallet } = selectedWallet;

        const andromedaAccount = getAccountWithChainDataFromManyWallets(
            walletsChainData,
            wallet?.Wallet.ID,
            account?.ID
        );

        setPaymentLink(null);

        if (andromedaAccount && wallet?.Wallet.Type === WalletType.OnChain) {
            setPaymentLink(andromedaAccount?.account.getBitcoinUri(undefined, amount ? BigInt(amount) : undefined));
        }
    }, [amount, selectedWallet, walletsChainData]);

    return {
        selectedWallet,
        paymentLink,
        shouldShowAmountInput,
        amount,

        handleSelectWallet,
        showAmountInput: () => setShouldShowAmountInput(true),
        handleChangeAmount: (inputAmount) => {
            const numbered = Number(inputAmount);
            const nonConstrainedAmount = Number.isInteger(numbered) ? numbered : 0;

            setAmount(nonConstrainedAmount < 0 ? 0 : nonConstrainedAmount);
        },
    };
};
