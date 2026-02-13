import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

const useHasScheduledMessages = () => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [conversationCounts, loadingConversationCounts] = useConversationCounts();
    const [messageCounts, loadingMessageCounts] = useMessageCounts();
    const loading = loadingMailSettings || loadingConversationCounts || loadingMessageCounts;
    const counts = mailSettings.ViewMode === VIEW_MODE.GROUP ? conversationCounts : messageCounts;

    return [!!counts?.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.SCHEDULED)?.Total, loading];
};

export default useHasScheduledMessages;
