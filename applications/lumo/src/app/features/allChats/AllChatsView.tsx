import { useCallback, useMemo, useState } from 'react';
import { shallowEqual } from 'react-redux';

import { c } from 'ttag';

import { useIsChatHistoryHydrating } from '../../hooks/useIsChatHistoryHydrating';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useLumoSelector, useLumoStore } from '../../redux/hooks';
import { selectConversations } from '../../redux/selectors';
import type { ChatHistoryDateField } from '../../redux/slices/lumoUserSettings';
import type { Conversation } from '../../types';
import { AllChatsHeaderBar } from './AllChatsHeaderBar';
import { AllChatsHeaderNewChatButton } from './AllChatsHeaderNewChatButton';
import type { AllChatsFilterValue } from './filterAllChatsConversations';
import { filterAllChatsConversations, getAllChatsEmptyVariant } from './filterAllChatsConversations';
import { AllChatsMobileHeaderBar } from './mobile/AllChatsMobileHeaderBar';
import { selectAllChatsRowDataMap } from './selectAllChatsRowData';
import { AllChatsEmptyState } from './shared/AllChatsEmptyState';
import { ConversationListPanel } from './shared/ConversationListPanel';

import './AllChatsView.scss';

export const AllChatsView = () => {
    const store = useLumoStore();
    const getState = useCallback(() => store.getState(), [store]);
    const conversationsMap = useLumoSelector(selectConversations, shallowEqual);
    const rowDataMap = useLumoSelector(selectAllChatsRowDataMap, shallowEqual);
    const { hasLumoPlus } = useLumoPlan();
    const { isSmallScreen: isMobileLayout } = useIsLumoSmallScreen();
    const isChatHistoryHydrating = useIsChatHistoryHydrating();

    const [filter, setFilter] = useState<AllChatsFilterValue>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<ChatHistoryDateField>('updatedAt');
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const filteredConversations = useMemo<Conversation[]>(() => {
        return filterAllChatsConversations({
            conversations: Object.values(conversationsMap),
            filter,
            searchQuery,
            rowDataMap,
            sortField,
            hasLumoPlus,
            getState,
        });
    }, [conversationsMap, sortField, filter, hasLumoPlus, rowDataMap, searchQuery, getState]);

    const selectableConversationIds = useMemo(() => {
        return filterAllChatsConversations({
            conversations: Object.values(conversationsMap),
            filter,
            searchQuery: '',
            rowDataMap,
            sortField,
            hasLumoPlus,
            getState,
        }).map((conversation) => {
            return conversation.id;
        });
    }, [conversationsMap, filter, sortField, hasLumoPlus, rowDataMap, getState]);

    const layoutHeader = useMemo(() => {
        return {
            component: isMobileLayout ? (
                <AllChatsMobileHeaderBar
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    sortField={sortField}
                    onSortFieldChange={setSortField}
                    filter={filter}
                    onFilterChange={setFilter}
                    isSelectionMode={isSelectionMode}
                    onSelectionModeChange={setIsSelectionMode}
                />
            ) : (
                <AllChatsHeaderBar searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
            ),
            rightButton: isMobileLayout ? undefined : <AllChatsHeaderNewChatButton />,
        };
    }, [filter, isMobileLayout, isSelectionMode, searchQuery, sortField]);

    return (
        <LumoLayoutWithDrawer drawer={{ disabled: true }} header={layoutHeader}>
            <div className="all-chats-page all-chats-view">
                <div className="all-chats-page-main flex flex-column flex-1 min-h-0 px-4 md:pt-6 md:px-10">
                    <div className="all-chats-content-column flex flex-column flex-1 min-h-0">
                        <ConversationListPanel
                            title={c('collider_2025:Title').t`Chats`}
                            conversations={filteredConversations}
                            selectableConversationIds={selectableConversationIds}
                            filter={filter}
                            onFilterChange={setFilter}
                            sortField={sortField}
                            onSortFieldChange={setSortField}
                            isSelectionMode={isSelectionMode}
                            onSelectionModeChange={setIsSelectionMode}
                            isMobileLayout={isMobileLayout}
                            showHeaderControlsOnMobile={false}
                            isLoading={isChatHistoryHydrating}
                            emptyState={<AllChatsEmptyState variant={getAllChatsEmptyVariant(searchQuery, filter)} />}
                        />
                    </div>
                </div>
            </div>
        </LumoLayoutWithDrawer>
    );
};
