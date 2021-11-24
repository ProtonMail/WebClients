import { useLocation } from 'react-router-dom';
import { toMap } from '@proton/shared/lib/helpers/object';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LabelCount } from '@proton/shared/lib/interfaces';
import { c } from 'ttag';
import { Dispatch, SetStateAction } from 'react';
import { ConfirmModal } from '@proton/components/components/modal';
import { Button } from '@proton/components/components/button';
import { useConversationCounts, useMessageCounts, useModals } from '@proton/components/hooks';
import { useMailSettings } from '@proton/components/hooks/useMailSettings';
import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { useSendVerifications } from './useSendVerifications';
import { isConversationMode } from '../../helpers/mailSettings';
import { SCHEDULED_MESSAGES_LIMIT } from '../../constants';

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
    const { createModal } = useModals();

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

    const handleScheduleSendModal = async () => {
        if (scheduleCount.Total && scheduleCount.Total >= SCHEDULED_MESSAGES_LIMIT) {
            createModal(
                <ConfirmModal
                    title={c('Confirm modal title').t`Message saved to Drafts`}
                    confirm={<Button color="norm" type="submit">{c('Action').t`Got it`}</Button>}
                    cancel={null}
                >
                    {c('Info')
                        .t`Too many messages waiting to be sent. Please wait until another message has been sent to schedule this one.`}
                </ConfirmModal>
            );
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

    const handleScheduleSend = (scheduledAt: number) => {
        setModelMessage({
            ...modelMessage,
            draftFlags: {
                ...modelMessage.draftFlags,
                scheduledAt,
            },
        });

        setTimeout(handleSend);
    };

    return { scheduleCount, loadingScheduleCount, handleScheduleSendModal, handleScheduleSend };
};
