import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, Prompt } from '@proton/components/components';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

const StorageRewardModal = (props: ModalProps) => {
    const { isUserPaid } = useGetStartedChecklist();

    return (
        <Prompt
            {...props}
            title={
                isUserPaid
                    ? c('Get started checklist instructions').t`Checklist complete`
                    : c('Get started checklist instructions').t`You've unlocked 1 GB`
            }
            buttons={[<Button onClick={() => props?.onClose?.()}>{c('Action').t`Got it`}</Button>]}
        >
            <p className="m-0">
                {isUserPaid
                    ? c('Get started checklist instructions')
                          .t`Keep using ${MAIL_APP_NAME} to discover more ways ${BRAND_NAME} protects your privacy and simplifies emailing.`
                    : c('Get started checklist instructions')
                          .t`Bravo for making your email even more secure, convenient, and relevant! We've upped your free storage to a total of 1 GB.`}
            </p>
        </Prompt>
    );
};

export default StorageRewardModal;
