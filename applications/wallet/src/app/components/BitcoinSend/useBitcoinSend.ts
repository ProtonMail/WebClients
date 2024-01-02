import { useCallback, useState } from 'react';

import { WasmPaymentLink, WasmPaymentLinkKind } from '../../../pkg';
import { WalletType } from '../../types';

export enum BitcoinSendViews {
    PaymentLinkInput,
    SendMethodSelector,
    LightningSimpleSend,
    OnchainSimpleSend,
    OnchainTransactionBuilder,
    LoadingBroadcast,
    BroadcastConfirmed,
}

export const useBitcoinSend = () => {
    const [view, setView] = useState<BitcoinSendViews>(BitcoinSendViews.PaymentLinkInput);
    const [parsedPaymentLink, setParsedPaymentLink] = useState<WasmPaymentLink>();

    const handlePaymentLinkSubmit = useCallback((paymentLink: WasmPaymentLink) => {
        setParsedPaymentLink(paymentLink);

        switch (paymentLink.getKind()) {
            case WasmPaymentLinkKind.BitcoinAddress:
            case WasmPaymentLinkKind.BitcoinURI:
                setView(BitcoinSendViews.OnchainSimpleSend);
                break;
            case WasmPaymentLinkKind.LightningURI:
                setView(BitcoinSendViews.LightningSimpleSend);
                break;
            case WasmPaymentLinkKind.UnifiedURI:
                setView(BitcoinSendViews.SendMethodSelector);
                break;
        }
    }, []);

    const handleCreateTxFromScratch = useCallback(() => {
        setView(BitcoinSendViews.OnchainTransactionBuilder);
    }, []);

    const handleSelectSendMethod = useCallback((method) => {
        switch (method) {
            case WalletType.OnChain:
                setView(BitcoinSendViews.OnchainSimpleSend);
            case WalletType.Lightning:
                setView(BitcoinSendViews.LightningSimpleSend);
        }
    }, []);

    return { view, parsedPaymentLink, handlePaymentLinkSubmit, handleCreateTxFromScratch, handleSelectSendMethod };
};
