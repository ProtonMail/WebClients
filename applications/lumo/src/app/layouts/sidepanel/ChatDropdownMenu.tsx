import { useState } from 'react';

import { c } from 'ttag';

import { useConversationDelete } from '../../hooks/useConversationDelete';
import { useConversationStar } from '../../hooks/useConversationStar';
import type { Conversation } from '../../types';
import type { DropdownOptions } from '../../components/DropdownMenu';
import DropdownMenu from '../../components/DropdownMenu';
import FavoritesUpsellPrompt from '../../components/Buttons/FavoritesUpsellPrompt';
import ConfirmDeleteModal from '../../components/Modals/ConfirmDeleteModal';

interface Props {
    conversation: Conversation;
}

const ChatDropdownMenu = ({ conversation }: Props) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { handleStarToggle, showFavoritesUpsellModal, favoritesUpsellModalProps, isStarred } = useConversationStar({
        conversation,
        location: 'sidebar',
    });

    const { openConfirmationModal, showConfirmDeleteModal, handleDelete, confirmDeleteModalProps } =
        useConversationDelete({
            conversation,
        });

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
    };

    const options: DropdownOptions[] = [
        {
            label: !isStarred ? c('Option').t`Add to favorites` : c('Option').t`Remove from favorites`,
            icon: 'star',
            onClick: handleStarToggle,
        },
        { label: c('Option').t`Delete`, icon: 'trash', onClick: openConfirmationModal },
    ];

    return (
        <>
            <DropdownMenu options={options} onToggle={toggleDropdown} isOpen={isDropdownOpen} />
            {showConfirmDeleteModal && <ConfirmDeleteModal handleDelete={handleDelete} {...confirmDeleteModalProps} />}
            {showFavoritesUpsellModal && <FavoritesUpsellPrompt {...favoritesUpsellModalProps} />}
        </>
    );
};

export default ChatDropdownMenu;
