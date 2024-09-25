import { useMessageCounts } from '@proton/components/hooks';
import { useConversationCounts } from '@proton/mail/counts/conversationCounts';
import { useMailSettings } from '@proton/mail/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

const useHasSnoozedMessages = () => {
    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [conversationCounts, loadingConversationCounts] = useConversationCounts();
    const [messageCounts, loadingMessageCounts] = useMessageCounts();
    const loading = loadingMailSettings || loadingConversationCounts || loadingMessageCounts;
    const counts = mailSettings?.ViewMode === VIEW_MODE.GROUP ? conversationCounts : messageCounts;

    return [!!counts?.find(({ LabelID }) => LabelID === MAILBOX_LABEL_IDS.SNOOZED)?.Total, loading];
};

export default useHasSnoozedMessages;
