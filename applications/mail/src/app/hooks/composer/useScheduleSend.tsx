import { Dispatch, SetStateAction } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { AlertModal, useModalState } from '@proton/components';
import { useConversationCounts, useMessageCounts } from '@proton/components/hooks';
import { useMailSettings } from '@proton/components/hooks/useMailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { LabelCount } from '@proton/shared/lib/interfaces';

import { SCHEDULED_MESSAGES_LIMIT } from '../../constants';
import { isConversationMode } from '../../helpers/mailSettings';
import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { updateScheduled } from '../../logic/messages/scheduled/scheduledActions';
import { useAppDispatch } from '../../logic/store';
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
}: Props) => {
    const location = useLocation();
    const dispatch = useAppDispatch();

    const [waitBeforeScheduleModalProps, setWaitBeforeScheduleModalOpen] = useModalState();

    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [conversationCounts, loadingConversationCounts] = useConversationCounts();
    const [messageCounts, loadingMessageCounts] = useMessageCounts();
    const { preliminaryVerifications } = useSendVerifications(
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments
    );

    const referenceCount = toMap(
        isConversationMode(MAILBOX_LABEL_IDS.SCHEDULED, mailSettings, location) ? conversationCounts : messageCounts,
        'LabelID'
    ) as { [labelID: string]: LabelCount };

    const scheduleCount = referenceCount[MAILBOX_LABEL_IDS.SCHEDULED];

    const loadingScheduleCount = loadingMailSettings || loadingConversationCounts || loadingMessageCounts;

    const modal = (
        <AlertModal
            title={c('Confirm modal title').t`Message saved to Drafts`}
            buttons={[
                <Button color="norm" onClick={waitBeforeScheduleModalProps.onClose}>{c('Action').t`Got it`}</Button>,
            ]}
            {...waitBeforeScheduleModalProps}
        >
            {c('Info')
                .t`Too many messages waiting to be sent. Please wait until another message has been sent to schedule this one.`}
        </AlertModal>
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
    };

    return { scheduleCount, loadingScheduleCount, handleScheduleSendModal, handleScheduleSend, modal };
};
