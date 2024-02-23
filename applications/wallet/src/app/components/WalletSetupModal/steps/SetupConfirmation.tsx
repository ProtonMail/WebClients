import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

import { CreditCard } from './CreditCard';

interface Props {
    onOpenWallet: () => void;
    fingerprint?: string;
    walletName: string;
}

export const SetupConfirmation = ({ onOpenWallet, fingerprint, walletName }: Props) => {
    return (
        <ModalContent className="p-0 m-0">
            <div className="p-6 flex flex-column flex-nowrap">
                <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Your wallet is ready!`}</span>

                {/* Credit card design */}
                {fingerprint && <CreditCard walletName={walletName} walletFingerprint={fingerprint} />}

                <Button className="mt-8" color="norm" onClick={onOpenWallet}>{c('Wallet setup')
                    .t`Open your wallet`}</Button>
            </div>
        </ModalContent>
    );
};
