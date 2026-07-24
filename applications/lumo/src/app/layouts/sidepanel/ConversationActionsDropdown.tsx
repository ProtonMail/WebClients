import { useState } from 'react';
import type { RefObject } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton } from '@proton/components';

import FavoritesUpsellPrompt from '../../components/Guest/FavoritesUpsellPrompt';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import { useConversationStar } from '../../hooks/useConversationStar';
import type { Conversation } from '../../types';
import { ConversationDeleteFlow } from './ConversationDeleteFlow';

interface Props {
    conversation: Conversation;
    anchorRef: RefObject<HTMLButtonElement>;
    isOpen: boolean;
    onClose: () => void;
}

const ConversationActionsDropdown = ({ conversation, anchorRef, isOpen, onClose }: Props) => {
    const [showDeleteFlow, setShowDeleteFlow] = useState(false);
    const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } = useConversationStar({
        conversation,
        location: 'sidebar',
    });

    return (
        <>
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={onClose}
                originalPlacement="bottom-end"
                className="chat-dropdown-menu"
            >
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex flex-row flex-nowrap items-center gap-2 w-full"
                        onClick={handleStarToggle}
                    >
                        <LumoIcon name="Star" size={16} />
                        <span>
                            {!isStarred ? c('Option').t`Add to favorites` : c('Option').t`Remove from favorites`}
                        </span>
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="flex flex-row flex-nowrap items-center gap-2 w-full"
                        onClick={() => {
                            setShowDeleteFlow(true);
                            onClose();
                        }}
                    >
                        <LumoIcon name="Trash2" size={16} />
                        <span>{c('Option').t`Delete`}</span>
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
            {showDeleteFlow && (
                <ConversationDeleteFlow conversation={conversation} onClose={() => setShowDeleteFlow(false)} />
            )}
            {showFavoritesUpsellModal && <FavoritesUpsellPrompt {...favoritesUpsellModalProps} />}
        </>
    );
};

export default ConversationActionsDropdown;
