import { Link } from 'react-router-dom';

import { c } from 'ttag';

import ButtonLike from '@proton/atoms/Button/ButtonLike';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';

import { CreditCard } from './CreditCard';

interface Props {
    walletId?: string;
    fingerprint?: string;
    walletName: string;
}

export const SetupConfirmation = ({ walletId, fingerprint, walletName }: Props) => {
    return (
        <ModalContent className="p-0 m-0">
            <div className="p-6 flex flex-column flex-nowrap">
                <span className="block h4 text-bold mx-auto">{c('Wallet setup').t`Your wallet is ready!`}</span>

                {/* Credit card design */}
                {fingerprint && <CreditCard walletName={walletName} walletFingerprint={fingerprint} />}

                <ButtonLike className="mt-8" color="norm" as={Link} to={`/wallets/${walletId}`}>
                    {c('Wallet setup').t`Open your wallet`}
                </ButtonLike>
            </div>
        </ModalContent>
    );
};
