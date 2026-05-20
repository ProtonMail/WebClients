import { shallowEqual } from 'react-redux';

import { c } from 'ttag';

import { useConversation } from '../../providers/ConversationProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectStarredConversationsSorted } from '../../redux/selectors';
import RecentChatsList from '../sidepanel/RecentChatsList';
import { CollapsibleSidebarSection } from './components/CollapsibleSidebarSection';

interface FavoritesSidebarSectionProps {
    onItemClick?: () => void;
}

export const FavoritesSidebarSection = ({ onItemClick }: FavoritesSidebarSectionProps) => {
    const favorites = useLumoSelector(selectStarredConversationsSorted, shallowEqual);
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();

    if (favorites.length === 0 || isGuest) {
        return null;
    }

    return (
        <CollapsibleSidebarSection label={c('collider_2025:Title').t`Favorites`} className="favorites-sidebar-section">
            <div className="favorites-content overflow-auto">
                <RecentChatsList
                    conversations={favorites}
                    selectedConversationId={conversationId}
                    onItemClick={onItemClick}
                />
            </div>
        </CollapsibleSidebarSection>
    );
};
