import { shallowEqual } from 'react-redux';

import { c } from 'ttag';

import { IcStar } from '@proton/icons/icons/IcStar';

import { useConversation } from '../../providers/ConversationProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectStarredConversationsSorted } from '../../redux/selectors';
import RecentChatsList from '../sidepanel/RecentChatsList';
import { CollapsibleSidebarSection } from './components/CollapsibleSidebarSection';

interface FavoritesSidebarSectionProps {
    showText: boolean;
    onItemClick?: () => void;
}

export const FavoritesSidebarSection = ({ showText, onItemClick }: FavoritesSidebarSectionProps) => {
    const favorites = useLumoSelector(selectStarredConversationsSorted, shallowEqual);
    const { conversationId } = useConversation();
    const isGuest = useIsGuest();

    if (favorites.length === 0 || isGuest) {
        return null;
    }

    return (
        <CollapsibleSidebarSection
            label={c('collider_2025:Title').t`Favorites`}
            icon={<IcStar size={4} />}
            showText={showText}
            className="favorites-sidebar-section"
        >
            <div className="favorites-content ml-4 overflow-auto">
                <RecentChatsList
                    conversations={favorites}
                    selectedConversationId={conversationId}
                    onItemClick={onItemClick}
                />
            </div>
        </CollapsibleSidebarSection>
    );
};
