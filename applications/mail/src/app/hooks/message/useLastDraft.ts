import { isDraft } from '@proton/shared/lib/mail/messages';
import { useConversation } from '../conversation/useConversation';
import { useMessage } from './useMessage';

export const useLastDraft = (inputConversationID: string) => {
    const { conversation: conversationState } = useConversation(inputConversationID || '', undefined);

    const drafts = conversationState?.Messages?.filter(message => isDraft(message));
    const lastDraftMessage = useMessage(drafts?.slice(-1)[0]?.ID || '', inputConversationID)

    return lastDraftMessage
}