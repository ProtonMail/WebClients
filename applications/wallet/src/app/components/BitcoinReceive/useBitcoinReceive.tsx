import { useEffect, useState } from 'react';

import { WasmPaymentLink } from '../../../pkg';
import { WalletAndAccountSelectorValue, getDefaultFormat } from '../../atoms';
import { useBlockchainContext } from '../../contexts';
import { WalletType } from '../../types/api';
import { getDefaultAccount, getSelectedWallet } from '../../utils';

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

export const useBitcoinReceive = (defaultWalletId?: number): UseBitcoinReceiveHelper => {
    const [paymentLink, setPaymentLink] = useState<WasmPaymentLink | null>(null);
    const { wallets } = useBlockchainContext();

    const defaultWallet = getSelectedWallet(wallets, defaultWalletId);

    const [selectedWallet, setSelectedWallet] = useState<WalletAndAccountSelectorValue>({
        wallet: defaultWallet,
        account: getDefaultAccount(defaultWallet),
        format: getDefaultFormat().value,
    });

    const [amount, setAmount] = useState(0);
    const [shouldShowAmountInput, setShouldShowAmountInput] = useState(false);

    const handleSelectWallet = (value: WalletAndAccountSelectorValue) => {
        setSelectedWallet((prev) => ({ ...prev, ...value }));
    };

    useEffect(() => {
        setSelectedWallet((prev) => ({ ...prev, account: getDefaultAccount(selectedWallet.wallet) }));
    }, [selectedWallet.wallet]);

    useEffect(() => {
        const { account, wallet } = selectedWallet;
        if (account && wallet?.Type === WalletType.OnChain) {
            void account.wasmAccount
                .getBitcoinUri(undefined, amount ? BigInt(amount) : undefined)
                .then((bitcoinUri) => setPaymentLink(bitcoinUri));
        }
    }, [amount, selectedWallet]);

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

            if (nonConstrainedAmount < 0) {
                setAmount(0);
            } else {
                setAmount(nonConstrainedAmount);
            }
        },
    };
};
