import { IWasmApiWalletData } from '@proton/wallet';

import { LightningSimpleSend } from './LightningSimpleSend';
import { OnchainSimpleSend } from './OnchainSimpleSend';
import { OnchainTransactionBuilder } from './OnchainTransactionBuilder';
import { PaymentLinkInput } from './PaymentLinkInput';
import { SendMethodSelector } from './SendMethodSelector';
import { BitcoinSendViews, useBitcoinSend } from './useBitcoinSend';

interface Props {
    defaultWalletId?: string;
    wallets: IWasmApiWalletData[];
}

export const BitcoinSend = ({ wallets, defaultWalletId }: Props) => {
    const { view, parsedPaymentLink, handleCreateTxFromScratch, handlePaymentLinkSubmit, handleSelectSendMethod } =
        useBitcoinSend();

    switch (view) {
        case BitcoinSendViews.OnchainTransactionBuilder:
            return <OnchainTransactionBuilder defaultWalletId={defaultWalletId} wallets={wallets} />;
        case BitcoinSendViews.SendMethodSelector:
            return <SendMethodSelector onSelectSendMethod={handleSelectSendMethod} />;
        case BitcoinSendViews.OnchainSimpleSend:
            return (
                <OnchainSimpleSend
                    defaultWalletId={defaultWalletId}
                    paymentLink={parsedPaymentLink}
                    wallets={wallets}
                />
            );
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
