import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { c } from 'ttag';

import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { useIsChatHistoryHydrating } from '../../hooks/useIsChatHistoryHydrating';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useLumoSelector, useLumoStore } from '../../redux/hooks';
import { selectConversations } from '../../redux/selectors';
import type { Conversation } from '../../types';
import { AllChatsHeaderNewChatButton } from './AllChatsHeaderNewChatButton';
import { AllChatsHeaderSearch } from './AllChatsHeaderSearch';
import type { AllChatsFilterValue, AllChatsSortValue } from './filterAllChatsConversations';
import {
    getAllChatsEmptyVariant,
    getSortedAllChatsConversations,
    searchAllChatsConversations,
} from './filterAllChatsConversations';
import { selectAllChatsRowDataMap } from './selectAllChatsRowData';
import { AllChatsEmptyState } from './shared/AllChatsEmptyState';
import { AllChatsTitle } from './shared/AllChatsHeader';
import { ConversationListPanel } from './shared/ConversationListPanel';

export const AllChatsView = () => {
    useNativeComposerVisibilityApi({ hideComposer: true });
    const store = useLumoStore();
    const getState = useCallback(() => store.getState(), [store]);
    const conversationsMap = useLumoSelector(selectConversations, shallowEqual);
    const rowDataMap = useLumoSelector(selectAllChatsRowDataMap, shallowEqual);
    const { hasLumoPlus } = useLumoPlan();
    const { isSmallScreen: isMobileLayout } = useIsLumoSmallScreen();
    const isChatHistoryHydrating = useIsChatHistoryHydrating();

    const [filter, setFilter] = useState<AllChatsFilterValue>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sort, setSort] = useState<AllChatsSortValue>('newest');
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const title = c('collider_2025:Title').t`All chats`;

    // Filter and sort once; the ids for "select all" come from this list, before any search.
    const sortedConversations = useMemo<Conversation[]>(() => {
        return getSortedAllChatsConversations({
            conversations: Object.values(conversationsMap),
            filter,
            rowDataMap,
            sort,
            hasLumoPlus,
        });
    }, [conversationsMap, sort, filter, hasLumoPlus, rowDataMap]);

    const selectableConversationIds = useMemo(() => {
        return sortedConversations.map((conversation) => {
            return conversation.id;
        });
    }, [sortedConversations]);

    // The typed text stays instant; the list search catches up when the browser is idle.
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const filteredConversations = useMemo<Conversation[]>(() => {
        return searchAllChatsConversations(sortedConversations, deferredSearchQuery, getState);
    }, [sortedConversations, deferredSearchQuery, getState]);

    // Small screens put the title in the top bar, between the sidebar button and New chat.
    const layoutHeader = useMemo(() => {
        if (!isMobileLayout) {
            return undefined;
        }

        return {
            component: <AllChatsTitle title={title} count={filteredConversations.length} />,
            rightButton: <AllChatsHeaderNewChatButton />,
        };
    }, [filteredConversations.length, isMobileLayout, title]);

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }} header={layoutHeader}>
            <div className="flex flex-column flex-1 min-h-0 px-4 md:px-10 md:pt-2">
                <div
                    className="flex flex-column flex-1 min-h-0 w-full max-w-custom mx-auto"
                    style={{ '--max-w-custom': '60rem' }}
                >
                    <ConversationListPanel
                        title={title}
                        showTitle={!isMobileLayout}
                        searchSlot={
                            <AllChatsHeaderSearch searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
                        }
                        conversations={filteredConversations}
                        selectableConversationIds={selectableConversationIds}
                        filter={filter}
                        onFilterChange={setFilter}
                        sort={sort}
                        onSortChange={setSort}
                        isSelectionMode={isSelectionMode}
                        onSelectionModeChange={setIsSelectionMode}
                        isMobileLayout={isMobileLayout}
                        isLoading={isChatHistoryHydrating}
                        emptyState={
                            <AllChatsEmptyState variant={getAllChatsEmptyVariant(deferredSearchQuery, filter)} />
                        }
                    />
                </div>
            </div>
        </LumoLayoutWithDrawer>
    );
};
