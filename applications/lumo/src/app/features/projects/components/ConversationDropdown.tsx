import { c } from 'ttag';

import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components';

interface ConversationDropdownProps {
    conversationId: string;
    onDelete: () => void;
}

export const ConversationDropdown = ({ onDelete }: ConversationDropdownProps) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        close();
        onDelete();
    };

    return (
        <>
            <button
                ref={anchorRef}
                className="conversation-menu-button shrink-0 p-1 rounded hover:bg-weak"
                aria-label={c('collider_2025:Action').t`More options`}
                onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                }}
            >
                <Icon name="three-dots-vertical" size={4} />
            </button>
            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close} className="chat-dropdown-menu">
                <DropdownMenu>
                    <DropdownMenuButton className="text-left color-danger" onClick={handleDelete}>
                        <Icon name="trash" className="mr-2" />
                        {c('collider_2025:Action').t`Delete conversation`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
