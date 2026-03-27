import { c } from 'ttag';

import type { ModalOwnProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import walletPaperPlaneDark from '@proton/styles/assets/img/wallet/wallet-paper-plane-dark.jpg';
import walletPaperPlane from '@proton/styles/assets/img/wallet/wallet-paper-plane.jpg';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import { Button } from '../../atoms';
import { ModalParagraph } from '../../atoms/ModalParagraph';
import { useWalletTheme } from '../Layout/Theme/WalletThemeProvider';

interface InviteSentConfirmModalOwnProps {
    email: string;
}

type Props = ModalOwnProps & InviteSentConfirmModalOwnProps;

export const InviteSentConfirmModal = ({ email, ...modalProps }: Props) => {
    const theme = useWalletTheme();

    return (
        <Prompt
            {...modalProps}
            buttons={
                <Button
                    data-testid="invite-sent-close-button"
                    fullWidth
                    size="large"
                    shape="solid"
                    color="norm"
                    onClick={modalProps.onClose}
                >{c('Wallet').t`Close`}</Button>
            }
        >
            <div className="flex flex-column">
                <div className="flex items-center flex-column mb-4">
                    <img
                        className="h-custom w-custom"
                        src={theme === WalletThemeOption.WalletDark ? walletPaperPlaneDark : walletPaperPlane}
                        alt=""
                        style={{ '--w-custom': '15rem', '--h-custom': '10.438rem' }}
                    />
                    <div className="flex flex-column items-center">
                        <span className="block text-4xl text-semibold text-center">{c('Wallet invite')
                            .t`Invitation sent to ${email}`}</span>
                    </div>
                </div>

                <ModalParagraph>
                    <p>{c('Wallet invite')
                        .t`Please let them know to check their email and follow the instruction to set up their ${WALLET_APP_NAME} with Bitcoin via Email.`}</p>
                    <p>{c('Wallet invite').t`Thank you for supporting ${WALLET_APP_NAME}!`}</p>
                </ModalParagraph>
            </div>
        </Prompt>
    );
};
