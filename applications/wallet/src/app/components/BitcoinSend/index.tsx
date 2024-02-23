import { LightningSimpleSend } from './LightningSimpleSend';
import { OnchainSimpleSend } from './OnchainSimpleSend';
import { OnchainTransactionBuilder } from './OnchainTransactionBuilder';
import { PaymentLinkInput } from './PaymentLinkInput';
import { SendMethodSelector } from './SendMethodSelector';
import { BitcoinSendViews, useBitcoinSend } from './useBitcoinSend';

interface Props {
    defaultWalletId?: string;
}

export const BitcoinSend = ({ defaultWalletId }: Props) => {
    const { view, parsedPaymentLink, handleCreateTxFromScratch, handlePaymentLinkSubmit, handleSelectSendMethod } =
        useBitcoinSend();

    switch (view) {
        case BitcoinSendViews.OnchainTransactionBuilder:
            return <OnchainTransactionBuilder defaultWalletId={defaultWalletId} />;
        case BitcoinSendViews.SendMethodSelector:
            return <SendMethodSelector onSelectSendMethod={handleSelectSendMethod} />;
        case BitcoinSendViews.OnchainSimpleSend:
            return <OnchainSimpleSend defaultWalletId={defaultWalletId} paymentLink={parsedPaymentLink} />;
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
