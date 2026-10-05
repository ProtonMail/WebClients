import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import claimExternalAddress from '@proton/styles/assets/img/byoe/claim-external-address.svg';
import claimStepDone from '@proton/styles/assets/img/byoe/claim-step-done.svg';
import claimStepNext from '@proton/styles/assets/img/byoe/claim-step-next.svg';

interface Props extends ModalStateProps {
    emailAddress: string;
}

export const ClaimableAddressModal = ({ emailAddress, ...rest }: Props) => {
    const { createNotification } = useNotifications();

    const handleConnectClick = () => {
        // TODO DAWG-38: replace this placeholder with the actual claim call (and translate any user-facing text)
        createNotification({
            text: `Coming in a future update`,
        });

        rest.onClose();
    };

    return (
        <Modal {...rest}>
            <ModalContent>
                <div className="flex flex-column items-center text-center gap-5">
                    <img src={claimExternalAddress} height={176} width={440} alt="" />
                    <div className="flex flex-column items-center gap-2">
                        <h1 className="text-bold text-2xl m-0">{c('Header').t`Good to know before you connect`}</h1>
                        <p className="color-weak m-0">
                            {getBoldFormattedText(
                                c('Info')
                                    .t`**${emailAddress}** is also used to sign in to a separate ${BRAND_NAME} account, outside of ${MAIL_APP_NAME}.`
                            )}
                            <br />
                            {c('Info').t`Here's what happens when you continue:`}
                        </p>
                    </div>
                    <div className="w-full text-left rounded-lg p-5 flex flex-column bg-weak">
                        <div className="flex gap-3 items-start">
                            <div className="flex flex-column items-center shrink-0 self-stretch">
                                <img src={claimStepDone} width={24} height={24} alt="" />
                                <div className="flex-1 mt-1 bg-strong w-custom" style={{ '--w-custom': '2px' }} />
                            </div>
                            <div className="flex flex-column gap-0.5 pb-4">
                                <p className="m-0 text-semibold text-sm color-primary">{c('Info').t`Today`}</p>
                                <p className="m-0 text-semibold">{c('Info')
                                    .t`Your Gmail connects to this ${MAIL_APP_NAME} address`}</p>
                                <p className="m-0 color-weak text-sm">{c('Info')
                                    .t`Nothing changes in your other ${BRAND_NAME} account.`}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <img src={claimStepNext} width={24} height={24} alt="" className="shrink-0" />
                            <div className="flex flex-column gap-0.5">
                                <p className="m-0 text-semibold text-sm color-weak">{c('Info')
                                    .t`Next time you sign in to your other account`}</p>
                                <p className="m-0 text-semibold">{c('Info').t`You'll choose a new username`}</p>
                                <p className="m-0 color-weak text-sm">{c('Info')
                                    .t`You'll use it to sign in from then on. That's the only change.`}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-column items-center w-full gap-2">
                        <Button
                            fullWidth
                            size="large"
                            color="norm"
                            onClick={handleConnectClick}
                            data-testid="ClaimableAddressModal:connectButton"
                        >{c('Action').t`Got it, connect my Gmail`}</Button>
                        <ButtonLike
                            as={Href}
                            data-testid="ClaimableAddressModal:learnMoreLink"
                            shape="ghost"
                            color="norm"
                            target="_blank"
                            rel="noopener noreferrer"
                            href={getKnowledgeBaseUrl('/troubleshooting-easy-switch#gmail-connection-setup')}
                        >
                            {c('Action').t`Learn how this works`}
                            <IcArrowOutSquare className="ml-2" size={4} />
                        </ButtonLike>
                    </div>
                </div>
            </ModalContent>
        </Modal>
    );
};
