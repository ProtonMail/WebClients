import { useFlag } from '@proton/unleash/useFlag';

import { useCategoriesView } from '../../components/categoryView/useCategoriesView';
import { useMailDispatch } from '../../store/hooks';

import { load } from '../../store/conversations/conversationsActions';
import { useGetConversation } from './useConversation';

export const useCategoryViewConversationPrefetch = () => {
    const dispatch = useMailDispatch();
    const getConversation = useGetConversation();

    const { isCategoryViewEnabled } = useCategoriesView();
    const isCategoryViewConversationPrefetchDisabled = useFlag('CategoryViewConversationPrefetchDisabled');

    return (conversationID: string) => {
        const existing = getConversation(conversationID);
        if (isCategoryViewConversationPrefetchDisabled || !isCategoryViewEnabled || existing) {
            return;
        }

        void dispatch(load({ conversationID, messageID: undefined, silentFetch: true }));
    };
};
