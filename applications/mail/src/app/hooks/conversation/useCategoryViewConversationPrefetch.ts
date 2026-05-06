import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { load } from '../../store/conversations/conversationsActions';
import { useGetConversation } from './useConversation';

export const useCategoryViewConversationPrefetch = () => {
    const dispatch = useMailDispatch();
    const getConversation = useGetConversation();

    const { categoryViewAccess } = useCategoriesView();

    return (conversationID: string) => {
        const existing = getConversation(conversationID);
        if (!categoryViewAccess || existing) {
            return;
        }

        void dispatch(load({ conversationID, messageID: undefined, silentFetch: true }));
    };
};
