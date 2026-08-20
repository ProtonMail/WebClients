import { useMemo, useState } from 'react';

import { c } from 'ttag';

import DropdownMenu from '../../components/DropdownMenu';
import type { DropdownOptions } from '../../components/DropdownMenu';
import FavoritesUpsellPrompt from '../../components/Guest/FavoritesUpsellPrompt';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useConversationStar } from '../../hooks/useConversationStar';
import type { Conversation } from '../../types';
import { ConversationDeleteFlow } from './ConversationDeleteFlow';

interface Props {
    conversation: Conversation;
    onRename?: () => void;
    visibleOnHover?: boolean;
    includeStarOption?: boolean;
}

export const ConversationSidebarActions = ({
    conversation,
    onRename,
    visibleOnHover,
    includeStarOption = true,
}: Props) => {
    const [showDeleteFlow, setShowDeleteFlow] = useState(false);
    const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } = useConversationStar({
        conversation,
        location: 'sidebar',
    });

    const options: DropdownOptions[] = useMemo(
        () => [
            ...(includeStarOption
                ? [
                      {
                          label: !isStarred ? c('Option').t`Add to favorites` : c('Option').t`Remove from favorites`,
                          icon: <LumoIcon name="Star" size={16} />,
                          onClick: (e?: React.MouseEvent) => {
                              e?.stopPropagation();
                              handleStarToggle();
                          },
                      },
                  ]
                : []),
            ...(onRename
                ? [
                      {
                          label: c('Option').t`Rename`,
                          icon: <LumoIcon name="Pencil" size={16} />,
                          onClick: (e?: React.MouseEvent) => {
                              e?.stopPropagation();
                              onRename();
                          },
                      },
                  ]
                : []),
            {
                label: c('Option').t`Delete`,
                icon: <LumoIcon name="Trash2" size={16} />,
                onClick: (e) => {
                    e?.stopPropagation();
                    setShowDeleteFlow(true);
                },
            },
        ],
        [handleStarToggle, includeStarOption, isStarred, onRename]
    );

    return (
        <>
            <DropdownMenu options={options} onToggle={() => {}} visibleOnHover={visibleOnHover} />
            {showDeleteFlow && (
                <ConversationDeleteFlow conversation={conversation} onClose={() => setShowDeleteFlow(false)} />
            )}
            {showFavoritesUpsellModal && <FavoritesUpsellPrompt {...favoritesUpsellModalProps} />}
        </>
    );
};
