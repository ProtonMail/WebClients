import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { updateConfirmLink } from '@proton/shared/lib/api/mailSettings';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import { CONFIRM_LINK } from '@proton/shared/lib/mail/mailSettings';

import { useApi, useEventManager } from '../../../hooks';
import LinkConfirmationModalLink from './LinkConfirmationModalLink';
import LinkConfirmationModalPhishing from './LinkConfirmationModalPhishing';

interface Props extends ModalProps {
    link?: string;
    isOutside?: boolean;
    isPhishingAttempt?: boolean;
    modalProps: ModalStateProps;
}

const LinkConfirmationModal = ({ link = '', isOutside = false, isPhishingAttempt = false, modalProps }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const [dontAskAgain, setDontAskAgain] = useState(false);
    const [understandRisk, setUnderstandRisk] = useState(false);

    // https://jira.protontech.ch/browse/SEC-574
    const linkToShow = rtlSanitize(link);

    // Both are not able to open the link
    const isPunnyCodeLink = /:\/\/xn--/.test(link);

    const handleConfirm = async () => {
        modalProps.onClose();

        openNewTab(link);

        if (dontAskAgain && !isOutside) {
            await api(updateConfirmLink(CONFIRM_LINK.DISABLED));
            await call();
        }
    };

    return (
        <ModalTwo size="large" as={Form} onSubmit={handleConfirm} {...modalProps}>
            <ModalTwoHeader
                title={
                    isPhishingAttempt ? c('Title').t`Warning: suspected fake website` : c('Title').t`Link confirmation`
                }
            />
            <ModalTwoContent>
                {isPhishingAttempt ? (
                    <LinkConfirmationModalPhishing
                        link={linkToShow}
                        onToggle={() => setUnderstandRisk(!understandRisk)}
                        value={understandRisk}
                    />
                ) : (
                    <LinkConfirmationModalLink
                        value={dontAskAgain}
                        isOutside={isOutside}
                        isPunnyCoded={isPunnyCodeLink}
                        link={linkToShow}
                        onToggle={() => setDontAskAgain(!dontAskAgain)}
                    />
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('Action').t`Cancel`}</Button>
                {/* translator: this string is only for blind people, it will be vocalized: confirm opening of link https://link.com */}
                <Button
                    color="norm"
                    type="submit"
                    autoFocus
                    aria-label={c('Action').t`Confirm opening of link ${linkToShow}`}
                    disabled={isPhishingAttempt && !understandRisk}
                >
                    {c('Action').t`Confirm`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default LinkConfirmationModal;
