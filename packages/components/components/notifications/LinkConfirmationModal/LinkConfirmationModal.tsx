import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useApi from '@proton/components/hooks/useApi';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store';
import { updateConfirmLink } from '@proton/shared/lib/api/mailSettings';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { rtlSanitize } from '@proton/shared/lib/helpers/string';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { CONFIRM_LINK } from '@proton/shared/lib/mail/mailSettings';

import LinkConfirmationModalLink from './LinkConfirmationModalLink';
import LinkConfirmationModalPhishing from './LinkConfirmationModalPhishing';

interface Props extends ModalProps {
    link?: string;
    isOutside?: boolean;
    isPhishingAttempt?: boolean;
    // Used as a confirmation callback when users confirms they want to open the link
    onConfirm?: () => void;
}

const LinkConfirmationModal = ({
    link = '',
    isOutside = false,
    isPhishingAttempt = false,
    onConfirm,
    ...rest
}: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const [dontAskAgain, setDontAskAgain] = useState(false);
    const [understandRisk, setUnderstandRisk] = useState(false);

    // https://jira.protontech.ch/browse/SEC-574
    const linkToShow = rtlSanitize(link);

    // Both are not able to open the link
    const isPunnyCodeLink = /:\/\/xn--/.test(link);

    const handleConfirm = async () => {
        rest.onClose?.();
        onConfirm?.();

        openNewTab(link);

        if (dontAskAgain && !isOutside) {
            const { MailSettings } = await api<{ MailSettings: MailSettings }>(
                updateConfirmLink(CONFIRM_LINK.DISABLED)
            );
            dispatch(mailSettingsActions.updateMailSettings(MailSettings));
        }
    };

    return (
        <ModalTwo size="large" {...rest}>
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
                <Button onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>
                {/* translator: this string is only for blind people, it will be vocalized: confirm opening of link https://link.com */}
                <Button
                    autoFocus
                    color="norm"
                    type="button"
                    onClick={handleConfirm}
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
