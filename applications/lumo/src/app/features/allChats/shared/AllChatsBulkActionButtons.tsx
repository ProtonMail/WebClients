import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { AllChatsMoveToProjectMenu } from './AllChatsMoveToProjectMenu';

import '../AllChatsButtons.scss';

interface Props {
    /** `toolbar`: in the header on wide screens. `bar`: the bottom bar on small screens (Web/All chats/Bulk bar). */
    variant: 'toolbar' | 'bar';
    disabled: boolean;
    /** False hides Move (flag off, guests) and disables it when none of the selected chats can move. */
    showMove: boolean;
    canMove: boolean;
    onFavorite: () => void;
    onMove: (spaceId: string, projectName: string) => void;
    onDelete: () => void;
}

export const AllChatsBulkActionButtons = ({
    variant,
    disabled,
    showMove,
    canMove,
    onFavorite,
    onMove,
    onDelete,
}: Props) => {
    const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
    const moveButtonRef = useRef<HTMLButtonElement>(null);
    const isBar = variant === 'bar';
    const buttonClassName = clsx(
        'flex flex-nowrap items-center justify-center gap-2 font-medium',
        isBar ? 'flex-1' : 'shrink-0'
    );
    const size = isBar ? 'medium' : 'small';

    return (
        <>
            <Button shape="ghost" size={size} className={buttonClassName} disabled={disabled} onClick={onFavorite}>
                <LumoIcon name="Star" size={16} className="shrink-0" />
                {isBar ? c('collider_2025:Action').t`Favorite` : c('collider_2025:Action').t`Add to favorites`}
            </Button>
            {showMove ? (
                <>
                    <Button
                        ref={moveButtonRef}
                        shape="ghost"
                        size={size}
                        className={buttonClassName}
                        disabled={disabled || !canMove}
                        aria-expanded={isMoveMenuOpen}
                        onClick={() => {
                            setIsMoveMenuOpen((open) => {
                                return !open;
                            });
                        }}
                    >
                        <LumoIcon name="Folder" size={16} className="shrink-0" />
                        {isBar ? c('collider_2025:Action').t`Move` : c('collider_2025:Action').t`Move to project`}
                    </Button>
                    <AllChatsMoveToProjectMenu
                        isOpen={isMoveMenuOpen}
                        anchorRef={moveButtonRef}
                        onClose={() => {
                            setIsMoveMenuOpen(false);
                        }}
                        onSelect={onMove}
                        // The bottom bar opens it above, in thumb reach.
                        placement={isBar ? 'top' : 'bottom-end'}
                    />
                </>
            ) : null}
            <Button
                shape="outline"
                color="danger"
                size={size}
                className={buttonClassName}
                disabled={disabled}
                onClick={onDelete}
            >
                <LumoIcon name="Trash" size={16} className="shrink-0" />
                {c('collider_2025:Action').t`Delete`}
            </Button>
        </>
    );
};
