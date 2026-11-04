import { c } from 'ttag';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { AllChatsEmptyVariant } from '../filterAllChatsConversations';

interface AllChatsEmptyStateProps {
    variant: AllChatsEmptyVariant;
}

export const AllChatsEmptyState = ({ variant }: AllChatsEmptyStateProps) => {
    const content = (() => {
        if (variant === 'no-favorites') {
            return {
                icon: 'Star' as const,
                heading: c('collider_2025:Title').t`No favorites yet`,
                subline: c('collider_2025:Info').t`Star a chat to find it here quickly.`,
            };
        }

        if (variant === 'no-projects') {
            return {
                icon: 'FolderOpen' as const,
                heading: c('collider_2025:Title').t`No project chats yet`,
                subline: c('collider_2025:Info').t`Chats from your projects will appear here.`,
            };
        }

        if (variant === 'no-results') {
            return {
                icon: 'Search' as const,
                heading: c('collider_2025:Title').t`No matching chats`,
                subline: c('collider_2025:Info').t`Try a different search term.`,
            };
        }

        return {
            icon: 'MessageCircle' as const,
            heading: c('collider_2025:Title').t`No chats yet`,
            subline: c('collider_2025:Info').t`Start a new chat to see it here.`,
        };
    })();

    return (
        <div className="flex flex-column items-center justify-center gap-2 h-full px-6 mx-auto">
            <div className="all-chats-empty-icon flex items-center justify-center rounded-full p-4">
                <LumoIcon name={content.icon} size={24} />
            </div>
            <h2 className="text-lg text-semibold m-0">{content.heading}</h2>
            <p className="text-sm color-weak m-0">{content.subline}</p>
        </div>
    );
};
