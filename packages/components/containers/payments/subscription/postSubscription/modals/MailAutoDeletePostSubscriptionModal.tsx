import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateAutoDelete } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { AUTO_DELETE_SPAM_AND_TRASH_DAYS } from '@proton/shared/lib/mail/mailSettings';
import illustration from '@proton/styles/assets/img/illustrations/check.svg';

import { SUBSCRIPTION_STEPS } from '../../constants';
import type { PostSubscriptionModalComponentProps } from '../interface';
import {
    PostSubscriptionModalContent,
    PostSubscriptionModalLoadingContent,
    PostSubscriptionModalWrapper,
} from './PostSubscriptionModalsComponents';

const MailAutoDeletePostSubscriptionModal = (props: PostSubscriptionModalComponentProps) => {
    const { modalProps, step, onDisplayFeatureTour, onRemindMeLater } = props;
    const dispatch = useDispatch();
    const [displayLoadingModal, setDisplayLoadingModal] = useState(true);
    const api = useApi();
    const [mailSettings] = useMailSettings();
    const isPremiumFeatureEnabled = mailSettings.AutoDeleteSpamAndTrashDays === AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE;

    const isSetupActionDoneRef = useRef(false);

    useEffect(() => {
        if (step === SUBSCRIPTION_STEPS.THANKS && !isSetupActionDoneRef.current) {
            const setupAction = async () => {
                if (!isPremiumFeatureEnabled) {
                    const { MailSettings } = await api<{ MailSettings: MailSettings }>(
                        updateAutoDelete(AUTO_DELETE_SPAM_AND_TRASH_DAYS.ACTIVE)
                    );
                    dispatch(mailSettingsActions.updateMailSettings(MailSettings));
                } else {
                    return Promise.resolve();
                }
            };

            const hideLoadingModal = () => {
                setDisplayLoadingModal(false);
            };

            setupAction().then(hideLoadingModal, hideLoadingModal);
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
