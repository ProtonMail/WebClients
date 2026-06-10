import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import type { MessageState, MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { useMailDispatch } from 'proton-mail/store/hooks';

import useScheduleSendFeature from '../../components/composer/actions/scheduleSend/useScheduleSendFeature';
import { SCHEDULED_MESSAGES_LIMIT } from '../../constants';
import { updateScheduled } from '../../store/messages/scheduled/scheduledActions';
import { useMailboxCounter } from '../mailboxCounter/useMailboxCounter';
import { useSendVerifications } from './useSendVerifications';

interface Props {
    modelMessage: MessageStateWithData;
    setInnerModal: Dispatch<SetStateAction<any>>;
    ComposerInnerModal: any;
    setModelMessage: Dispatch<SetStateAction<MessageState>>;
    handleSend: () => void;
    handleNoRecipients?: () => void;
    handleNoSubjects?: () => void;
    handleNoAttachments?: (keyword: string) => void;
    handleNoReplyEmail?: (email: string) => void;
}

export const useScheduleSend = ({
    modelMessage,
    setInnerModal,
    ComposerInnerModal,
    setModelMessage,
    handleSend,
    handleNoRecipients,
    handleNoSubjects,
    handleNoAttachments,
    handleNoReplyEmail,
}: Props) => {
    const { canScheduleSend } = useScheduleSendFeature();
    const isRetentionPoliciesEnabled = useFlag('DataRetentionPolicy');

    const dispatch = useMailDispatch();

    const [waitBeforeScheduleModalProps, setWaitBeforeScheduleModalOpen] = useModalState();

    const { preliminaryVerifications } = useSendVerifications(
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
        handleNoReplyEmail
    );

    const { getLocationCount, loading } = useMailboxCounter();
    const scheduleCount = getLocationCount(MAILBOX_LABEL_IDS.SCHEDULED);

    const modal = (
        <Prompt
            title={c('Confirm modal title').t`Message saved to Drafts`}
            buttons={[
                <Button color="norm" onClick={waitBeforeScheduleModalProps.onClose}>{c('Action').t`Got it`}</Button>,
            ]}
            data-testid="composer:schedule-send:schedule-limit-reached"
            {...waitBeforeScheduleModalProps}
        >
            {c('Info')
                .t`Too many messages waiting to be sent. Please wait until another message has been sent to schedule this one.`}
        </Prompt>
    );

    const handleScheduleSendModal = async () => {
        if (scheduleCount.Total && scheduleCount.Total >= SCHEDULED_MESSAGES_LIMIT) {
            setWaitBeforeScheduleModalOpen(true);
        } else {
            try {
                await preliminaryVerifications(modelMessage, {
                    noReplyEmail: false, // Skip no-reply email detection, checked in handleScheduleSend
                });
                setInnerModal(ComposerInnerModal.ScheduleSend);
            } catch {
                /* Nothing to do but an error is expected if preliminaryVerifications fails
                Catching the error is mandatory to make testing pass for some jest sorcery
                */
            }
        }
    };

    const handleScheduleSend = async (scheduledAt: number) => {
        if (scheduleCount.Total && scheduleCount.Total >= SCHEDULED_MESSAGES_LIMIT) {
            setWaitBeforeScheduleModalOpen(true);
        } else {
            try {
                // check if all needed composer fields are filled
                await preliminaryVerifications(modelMessage);

                // Save scheduled at in store
                dispatch(updateScheduled({ ID: modelMessage.localID, scheduledAt }));

                // Save scheduled at in message model
                setModelMessage({
                    ...modelMessage,
                    draftFlags: {
                        ...modelMessage.draftFlags,
                        scheduledAt,
                    },
                });

                // Handle send
                setTimeout(handleSend);
            } catch {}
        }
    };

    const hasExpiration = modelMessage.draftFlags?.expiresIn || modelMessage.data?.ExpirationTime;

    // With retention policies enabled, BE will check if the scheduled time for the draft is within the expiration time,
    // thus we can safely remove the check for draft expiration
    return {
        canScheduleSend: canScheduleSend && (isRetentionPoliciesEnabled || !hasExpiration),
        scheduleCount,
        loadingScheduleCount: loading,
        handleScheduleSendModal,
        handleScheduleSend,
        modal,
    };
};
