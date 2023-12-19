import { LightningSimpleSend } from './LightningSimpleSend';
import { OnchainSimpleSend } from './OnchainSimpleSend';
import { OnchainTransactionBuilder } from './OnchainTransactionBuilder';
import { PaymentLinkInput } from './PaymentLinkInput';
import { SendMethodSelector } from './SendMethodSelector';
import { useBitcoinSend } from './useBitcoinSend';

interface Props {
    defaultWalletId: number;
}

enum BitcoinSendViews {
    PaymentLinkInput,
    SendMethodSelector,
    LightningSimpleSend,
    OnchainSimpleSend,
    OnchainTransactionBuilder,
    LoadingBroadcast,
    BroadcastConfirmed,
}

export const BitcoinSend = ({ defaultWalletId }: Props) => {
    const { view, handleCreateTxFromScratch, handlePaymentLinkSubmit, handleSelectSendMethod } = useBitcoinSend();

    switch (view) {
        case BitcoinSendViews.OnchainTransactionBuilder:
            return <OnchainTransactionBuilder defaultWalletId={defaultWalletId} />;
        case BitcoinSendViews.SendMethodSelector:
            return <SendMethodSelector onSelectSendMethod={handleSelectSendMethod} />;
        case BitcoinSendViews.OnchainSimpleSend:
            return <OnchainSimpleSend />;
        case BitcoinSendViews.LightningSimpleSend:
            return <LightningSimpleSend />;
        default:
            return (
                <PaymentLinkInput
                    onPaymentLinkSubmit={handlePaymentLinkSubmit}
                    onCreateTxFromScratch={handleCreateTxFromScratch}
                />
            );
    }
};
