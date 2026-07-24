import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';

import { MenuDropdown } from '../../../components/Composer/components/MenuDropdown';
import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';

import '../AllChatsHeaderActions.scss';

const MenuCheckmark = ({ visible }: { visible: boolean }) => {
    return (
        <span className={clsx('flex items-center shrink-0', !visible && 'visibility-hidden')}>
            <LumoIcon name="Check" size={16} className="color-primary" />
        </span>
    );
};

interface AllChatsMobileOptionsMenuProps {
    isSelectionMode: boolean;
    onSelectionModeChange: (enabled: boolean) => void;
    onRequestDeleteAll: () => void;
    isDeleteAllDisabled: boolean;
}

export const AllChatsMobileOptionsMenu = ({
    isSelectionMode,
    onSelectionModeChange,
    onRequestDeleteAll,
    isDeleteAllDisabled,
}: AllChatsMobileOptionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);
    const buttonLabel = c('collider_2025:Button').t`More options`;

    return (
        <>
            <Button
                ref={anchorRef}
                icon
                shape="outline"
                size="medium"
                className={clsx(
                    'all-chats-header-action-button all-chats-mobile-options-menu-button shrink-0',
                    isSelectionMode && 'is-active'
                )}
                aria-label={buttonLabel}
                aria-expanded={isOpen}
                onMouseDown={(event) => {
                    event.preventDefault();
                }}
                onClick={() => {
                    setIsOpen((open) => {
                        return !open;
                    });
                }}
            >
                <LumoIcon name="Ellipsis" size={14} />
            </Button>

            <MenuDropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => {
                    setIsOpen(false);
                }}
                placement="bottom-end"
            >
                <DropdownMenuButton
                    className="justify-start"
                    onMouseDown={(event) => {
                        event.preventDefault();
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelectionModeChange(!isSelectionMode);
                        setIsOpen(false);
                    }}
                >
                    <div className="flex items-center gap-3 w-full">
                        <LumoIcon name="ListChecks" size={16} className="color-weak shrink-0" />
                        <span className="text-sm font-medium flex-1 text-left">
                            {c('collider_2025:Action').t`Select chats`}
                        </span>
                        <MenuCheckmark visible={isSelectionMode} />
                    </div>
                </DropdownMenuButton>
                <DropdownMenuButton
                    className="justify-start"
                    disabled={isDeleteAllDisabled}
                    onMouseDown={(event) => {
                        event.preventDefault();
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                        onRequestDeleteAll();
                        setIsOpen(false);
                    }}
                >
                    <div className="flex items-center gap-3 w-full">
                        <LumoIcon name="Flame" size={16} className="color-weak shrink-0" />
                        <span className="text-sm font-medium flex-1 text-left">
                            {c('collider_2025: Button').t`Delete all`}
                        </span>
                    </div>
                </DropdownMenuButton>
            </MenuDropdown>
        </>
    );
};
