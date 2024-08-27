import type { Dispatch, SetStateAction } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Prompt, useModalState } from '@proton/components';
import { useConversationCounts, useMessageCounts } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { LabelCount } from '@proton/shared/lib/interfaces';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch } from 'proton-mail/store/hooks';

import useScheduleSendFeature from '../../components/composer/actions/scheduleSend/useScheduleSendFeature';
import { SCHEDULED_MESSAGES_LIMIT } from '../../constants';
import { isConversationMode } from '../../helpers/mailSettings';
import type { MessageState, MessageStateWithData } from '../../store/messages/messagesTypes';
import { updateScheduled } from '../../store/messages/scheduled/scheduledActions';
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

    const location = useLocation();
    const dispatch = useMailDispatch();

    const [waitBeforeScheduleModalProps, setWaitBeforeScheduleModalOpen] = useModalState();

    const mailSettings = useMailModel('MailSettings');
    const [conversationCounts, loadingConversationCounts] = useConversationCounts();
    const [messageCounts, loadingMessageCounts] = useMessageCounts();
    const { preliminaryVerifications } = useSendVerifications(
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
        handleNoReplyEmail
    );

    const referenceCount = toMap(
        isConversationMode(MAILBOX_LABEL_IDS.SCHEDULED, mailSettings, location) ? conversationCounts : messageCounts,
        'LabelID'
    ) as { [labelID: string]: LabelCount };

    const scheduleCount = referenceCount[MAILBOX_LABEL_IDS.SCHEDULED];

    const loadingScheduleCount = loadingConversationCounts || loadingMessageCounts;

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
                await preliminaryVerifications(modelMessage);
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

    return {
        canScheduleSend: canScheduleSend && !modelMessage.draftFlags?.expiresIn && !modelMessage.data?.ExpirationTime,
        scheduleCount,
        loadingScheduleCount,
        handleScheduleSendModal,
        handleScheduleSend,
        modal,
    };
};
