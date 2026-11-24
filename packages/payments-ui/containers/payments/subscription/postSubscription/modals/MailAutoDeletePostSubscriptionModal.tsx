import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { PostSubscriptionModalComponentProps } from '@proton/components/containers/payments/subscription/postSubscription/interface';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import {
    PostSubscriptionModalContent,
    PostSubscriptionModalLoadingContent,
    PostSubscriptionModalWrapper,
} from './PostSubscriptionModalsComponents';

const MailAutoDeletePostSubscriptionModal = (props: PostSubscriptionModalComponentProps) => {
    const { modalProps, step, onDisplayFeatureTour, onRemindMeLater } = props;
    const { update } = useUpdateMailSetting();
    const [displayLoadingModal, setDisplayLoadingModal] = useState(true);
    const [mailSettings] = useMailSettings();
    const isPremiumFeatureEnabled = mailSettings.AutoDeleteSpamAndTrashDays === AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE;

    const isSetupActionDoneRef = useRef(false);

    useEffect(() => {
        if (step === SUBSCRIPTION_STEPS.THANKS && !isSetupActionDoneRef.current) {
            if (!isPremiumFeatureEnabled) {
                update('AutoDeleteSpamAndTrashDays', AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE, {
                    notify: false,
                });
            }

            setDisplayLoadingModal(false);
        }
    }, [step]);

    const canCloseModal = step === SUBSCRIPTION_STEPS.THANKS && !displayLoadingModal;

    return (
        <PostSubscriptionModalWrapper {...modalProps} canClose={canCloseModal}>
            {canCloseModal ? (
                <PostSubscriptionModalContent
                    title={c('Title').t`Upgrade complete!`}
                    subtitle={c('Title').t`Auto-deletion is active`}
                    description={c('Info')
                        .t`Emails moved to Trash and Spam more than 30 days ago will be cleared automatically.`}
                    illustration={illustration}
                    primaryButtonText={c('Button').t`Set up other features`}
                    primaryButtonCallback={onDisplayFeatureTour}
                    secondaryButtonText={c('Button').t`Remind me later`}
                    secondaryButtonCallback={onRemindMeLater}
                />
            ) : (
                <PostSubscriptionModalLoadingContent
                    title={
                        step === SUBSCRIPTION_STEPS.UPGRADE
                            ? c('Info').t`Registering your subscription…`
                            : c('Info').t`Enabling auto-deletion…`
                    }
                />
            )}
        </PostSubscriptionModalWrapper>
    );
};

export default MailAutoDeletePostSubscriptionModal;
