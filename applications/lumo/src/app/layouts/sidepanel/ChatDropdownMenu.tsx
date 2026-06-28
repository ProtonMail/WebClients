import { useRef } from 'react';

import { c } from 'ttag';

import type { DropdownOptions } from '../../components/DropdownMenu';
import DropdownMenu from '../../components/DropdownMenu';
import FavoritesUpsellPrompt from '../../components/Guest/FavoritesUpsellPrompt';
import { LumoIcon } from '../../components/LumoIcon/LumoIcon';
import ConfirmDeleteModal from '../../components/Modals/ConfirmDeleteModal';
import { useConversationDelete } from '../../hooks/useConversationDelete';
import { useConversationStar } from '../../hooks/useConversationStar';
import type { Conversation } from '../../types';

interface Props {
    conversation: Conversation;
    onOpenChange?: (isOpen: boolean) => void;
    additionalOptions?: DropdownOptions[];
}

const ChatDropdownMenu = ({ conversation, onOpenChange, additionalOptions = [] }: Props) => {
    const isOpenRef = useRef(false);

    const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } = useConversationStar({
        conversation,
        location: 'sidebar',
    });

    const { openConfirmationModal, showConfirmDeleteModal, handleDelete, confirmDeleteModalProps, hasGeneratedImages } =
        useConversationDelete({
            conversation,
        });

    const toggleDropdown = () => {
        isOpenRef.current = !isOpenRef.current;
        onOpenChange?.(isOpenRef.current);
    };

    const defaultOptions: DropdownOptions[] = [
        {
            label: !isStarred ? c('Option').t`Add to favorites` : c('Option').t`Remove from favorites`,
            icon: <LumoIcon name="Star" size={16} />,
            onClick: handleStarToggle,
        },
        { label: c('Option').t`Delete`, icon: <LumoIcon name="Trash2" size={16} />, onClick: openConfirmationModal },
    ];

    const options = [...additionalOptions, ...defaultOptions];

    return (
        <>
            <DropdownMenu options={options} onToggle={toggleDropdown} />
            {showConfirmDeleteModal && (
                <ConfirmDeleteModal
                    handleDelete={handleDelete}
                    hasGeneratedImages={hasGeneratedImages}
                    {...confirmDeleteModalProps}
                />
            )}
            {showFavoritesUpsellModal && <FavoritesUpsellPrompt {...favoritesUpsellModalProps} />}
        </>
    );
};

export default ChatDropdownMenu;
