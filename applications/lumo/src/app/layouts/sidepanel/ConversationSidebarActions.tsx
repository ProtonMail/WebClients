import { useMemo, useState } from 'react';

import { c } from 'ttag';

import DropdownMenu from '../../components/DropdownMenu';
import type { DropdownOptions } from '../../components/DropdownMenu';
import FavoritesUpsellPrompt from '../../components/Guest/FavoritesUpsellPrompt';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useConversationStar } from '../../hooks/useConversationStar';
import { useIsGuest } from '../../providers/IsGuestProvider';
import type { Conversation } from '../../types';
import { ConversationDeleteFlow } from './ConversationDeleteFlow';

interface Props {
    conversation: Conversation;
    onRename?: () => void;
    onOpenChange?: (isOpen: boolean) => void;
    onOverlayActiveChange?: (active: boolean) => void;
    visibleOnHover?: boolean;
    includeStarOption?: boolean;
}

export const ConversationSidebarActions = ({
    conversation,
    onRename,
    onOpenChange,
    onOverlayActiveChange,
    visibleOnHover,
    includeStarOption = true,
}: Props) => {
    const isGuest = useIsGuest();
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
                              if (isGuest) {
                                  onOverlayActiveChange?.(true);
                              }
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
                    onOverlayActiveChange?.(true);
                    setShowDeleteFlow(true);
                },
            },
        ],
        [handleStarToggle, includeStarOption, isGuest, isStarred, onOverlayActiveChange, onRename]
    );

    return (
        <>
            <DropdownMenu options={options} onToggle={onOpenChange} visibleOnHover={visibleOnHover} />
            {showDeleteFlow && (
                <ConversationDeleteFlow
                    conversation={conversation}
                    onClose={() => {
                        setShowDeleteFlow(false);
                        onOverlayActiveChange?.(false);
                    }}
                />
            )}
            {showFavoritesUpsellModal && (
                <FavoritesUpsellPrompt
                    {...favoritesUpsellModalProps}
                    onClose={() => {
                        favoritesUpsellModalProps.onClose?.();
                        onOverlayActiveChange?.(false);
                    }}
                />
            )}
        </>
    );
};
