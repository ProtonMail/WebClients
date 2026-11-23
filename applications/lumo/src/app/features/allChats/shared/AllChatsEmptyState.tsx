import { c } from 'ttag';

import type { IconName } from '../../../components/LumoIcon/LumoIcon';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { AllChatsEmptyVariant } from '../filterAllChatsConversations';

interface EmptyStateContent {
    icon: IconName;
    heading: string;
    subline: string;
}

const getEmptyStateContent = (variant: AllChatsEmptyVariant): EmptyStateContent => {
    if (variant === 'no-favorites') {
        return {
            icon: 'Star',
            heading: c('collider_2025:Title').t`No favorites yet`,
            subline: c('collider_2025:Info').t`Star a chat to find it here quickly.`,
        };
    }

    if (variant === 'no-projects') {
        return {
            icon: 'FolderOpen',
            heading: c('collider_2025:Title').t`No project chats yet`,
            subline: c('collider_2025:Info').t`Chats from your projects will appear here.`,
        };
    }

    if (variant === 'no-results') {
        return {
            icon: 'Search',
            heading: c('collider_2025:Title').t`No matching chats`,
            subline: c('collider_2025:Info').t`Try a different search term.`,
        };
    }

    return {
        icon: 'MessageCircle',
        heading: c('collider_2025:Title').t`No chats yet`,
        subline: c('collider_2025:Info').t`Start a new chat to see it here.`,
    };
};

interface AllChatsEmptyStateProps {
    variant: AllChatsEmptyVariant;
}

export const AllChatsEmptyState = ({ variant }: AllChatsEmptyStateProps) => {
    const content = getEmptyStateContent(variant);

    // Web/Empty state: icon tile, title and body, near the top of the list area.
    return (
        <div className="flex flex-column items-center gap-3 px-6 pt-12 md:pt-20 text-center">
            <div
                className="all-chats-empty-icon lumo-bg-control-fill-mid lumo-color-glyph flex shrink-0 items-center justify-center w-custom h-custom radius-16"
                style={{ '--w-custom': '3.5rem', '--h-custom': '3.5rem' }}
            >
                <LumoIcon name={content.icon} size={24} />
            </div>
            <h2 className="m-0 lumo-title-medium">{content.heading}</h2>
            <p className="m-0 lumo-color-glyph-mid">{content.subline}</p>
        </div>
    );
};
