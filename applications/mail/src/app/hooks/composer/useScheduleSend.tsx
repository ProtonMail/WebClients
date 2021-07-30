import { useLocation } from 'react-router-dom';
import { toMap } from '@proton/shared/lib/helpers/object';
import { isConversationMode } from 'proton-mail/src/app/helpers/mailSettings';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LabelCount } from '@proton/shared/lib/interfaces';
import { SCHEDULED_MESSAGES_LIMIT } from 'proton-mail/src/app/constants';
import { c } from 'ttag';
import React, { Dispatch, SetStateAction } from 'react';
import { MessageExtended, MessageExtendedWithData } from 'proton-mail/src/app/models/message';
import { useSendVerifications } from 'proton-mail/src/app/hooks/composer/useSendVerifications';
import { ConfirmModal } from '@proton/components/components/modal';
import { Button } from '@proton/components/components/button';
import { useConversationCounts, useMessageCounts, useModals } from '@proton/components/hooks';
import { useMailSettings } from '@proton/components/hooks/useMailSettings';

interface Props {
    modelMessage: MessageExtendedWithData;
    setInnerModal: React.Dispatch<React.SetStateAction<any>>;
    ComposerInnerModal: any;
    setModelMessage: Dispatch<SetStateAction<MessageExtended>>;
    handleSend: () => void;
}

export const useScheduleSend = ({
    modelMessage,
    setInnerModal,
    ComposerInnerModal,
    setModelMessage,
    handleSend,
}: Props) => {
    const location = useLocation();
    const { createModal } = useModals();

    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [conversationCounts, loadingConversationCounts] = useConversationCounts();
    const [messageCounts, loadingMessageCounts] = useMessageCounts();
    const { preliminaryVerifications } = useSendVerifications();

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
            await preliminaryVerifications(modelMessage);
            setInnerModal(ComposerInnerModal.ScheduleSend);
        }
    };

    const handleScheduleSend = (scheduledAt: number) => {
        setModelMessage({
            ...modelMessage,
            scheduledAt,
        });
        setTimeout(handleSend);
    };

    return { scheduleCount, loadingScheduleCount, handleScheduleSendModal, handleScheduleSend };
};
