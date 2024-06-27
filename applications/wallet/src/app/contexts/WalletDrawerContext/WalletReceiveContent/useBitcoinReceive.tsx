import { useEffect, useRef, useState } from 'react';

import { WasmApiWalletAccount, WasmPaymentLink } from '@proton/andromeda';
import useLoading from '@proton/hooks/useLoading';
import { BITCOIN_ADDRESS_INDEX_GAP_BEFORE_WARNING } from '@proton/wallet';

import { getAccountWithChainDataFromManyWallets } from '../../../utils';
import { useComputeNextAddressToReceive } from '../../../utils/hooks/useComputeNextIndexToReceive';
import { useBitcoinBlockchainContext } from '../../BitcoinBlockchainContext';

export interface UseBitcoinReceiveHelper {
    /**
     * True when we generate a new payment link
     */
    loadingPaymentLink: boolean;
    /**
     * Memoized. Can be either a bitcoin Address, a bitcoin URI, a lightning URI or unified URI (URI containing both bitcoin and lightning needed payment informations)
     */
    paymentLink?: WasmPaymentLink;
    shouldShowAmountInput: boolean;
    amount: number;

    isIndexAboveGap: boolean;
    incrementIndex: () => void;

    handleChangeAmount: (amount?: number) => void;
    showAmountInput: () => void;
}

export const useBitcoinReceive = (isOpen: boolean, account?: WasmApiWalletAccount): UseBitcoinReceiveHelper => {
    const [paymentLink, setPaymentLink] = useState<WasmPaymentLink>();
    const [loadingPaymentLink, withLoadingPaymentLink] = useLoading();

    const { walletsChainData } = useBitcoinBlockchainContext();

    const [index, setIndex] = useState(0);
    // This is used to check that user don't create too much gap between indexes
    const initialIndex = useRef(0);
    const [amount, setAmount] = useState(0);
    const [shouldShowAmountInput, setShouldShowAmountInput] = useState(false);

    const computeNextIndexToReceive = useComputeNextAddressToReceive(walletsChainData);

    useEffect(() => {
        const getIndex = async () => {
            if (account) {
                const nextIndex = await computeNextIndexToReceive(account);

                initialIndex.current = nextIndex;
                setIndex(nextIndex);
            }
        };

        void withLoadingPaymentLink(getIndex());
    }, [account, computeNextIndexToReceive, withLoadingPaymentLink]);

    useEffect(() => {
        if (!isOpen || !account) {
            return;
        }

        const wasmAccount = getAccountWithChainDataFromManyWallets(walletsChainData, account.WalletID, account.ID);

        const generatePaymentLink = async () => {
            const paymentAmount = amount ? BigInt(amount) : undefined;

            const generatedPaymentLink = await wasmAccount?.account.getBitcoinUri(index, paymentAmount);

            if (generatedPaymentLink) {
                setPaymentLink(generatedPaymentLink);
            }
        };

        void withLoadingPaymentLink(generatePaymentLink());
    }, [isOpen, amount, account, walletsChainData, withLoadingPaymentLink, index]);

    const incrementIndex = () => {
        setIndex((prev) => prev + 1);
    };

    const isIndexAboveGap = index - initialIndex.current > BITCOIN_ADDRESS_INDEX_GAP_BEFORE_WARNING;

    return {
        loadingPaymentLink,
        paymentLink,
        shouldShowAmountInput,
        amount,

        isIndexAboveGap,
        incrementIndex,

        showAmountInput: () => setShouldShowAmountInput(true),
        handleChangeAmount: (inputAmount) => {
            const numbered = Number(inputAmount);
            const nonConstrainedAmount = Number.isInteger(numbered) ? numbered : 0;

            setAmount(nonConstrainedAmount < 0 ? 0 : nonConstrainedAmount);
        },
    };
};
