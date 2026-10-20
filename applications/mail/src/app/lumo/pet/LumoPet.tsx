import type { FocusEvent, KeyboardEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getConversationActions } from '@proton/llm/lib/lumoAgent/ui/LumoConversationHeaderActions';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { PanelSide } from '../floating/panelSide';
import CatSprite from './CatSprite';
import LumoPetMenu from './LumoPetMenu';
import { selectCatPose } from './catPose';

import './LumoPet.scss';

interface CatActions {
    onToggle: () => void;
    onMove: () => void;
    onDock: () => void;
    onNewChat: () => void;
}

interface Props {
    side: PanelSide;
    isPanelOpen: boolean;
    actions: CatActions;
}

const LumoPet = ({ side, isPanelOpen, actions }: Props) => {
    const { onToggle, onMove, onDock, onNewChat } = actions;
    const { hasConversation, openDebugReport } = useLumoAgentDrawer();
    const [isHovered, setIsHovered] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const enterPointer = () => {
        setIsHovered(true);
        setIsMenuOpen(true);
    };
    const leavePointer = () => {
        setIsHovered(false);
        setIsMenuOpen(false);
    };
    // The cat leaves the pointer behind, and no pointerleave fires until the mouse next moves
    const leavePointerThen = (action: () => void) => {
        return () => {
            leavePointer();
            action();
        };
    };

    // A mouse press also focuses, but without :focus-visible, and its click must only toggle the card
    const openOnKeyboardFocus = (event: FocusEvent<HTMLDivElement>) => {
        if (event.target.matches(':focus-visible')) {
            setIsMenuOpen(true);
        }
    };
    // Opening the card moves focus to its prompt, which must not shut the menu under a resting pointer
    const closeOnFocusLeaving = (event: FocusEvent<HTMLDivElement>) => {
        if (!isHovered && !event.currentTarget.contains(event.relatedTarget)) {
            setIsMenuOpen(false);
        }
    };
    const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Escape' || !isMenuOpen) {
            return;
        }
        event.stopPropagation();
        setIsMenuOpen(false);
    };

    const pose = selectCatPose({
        isHovered,
    });

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            className={clsx('lumo-pet-dock relative', isMenuOpen && 'lumo-pet-dock--menu-open')}
            onPointerEnter={enterPointer}
            onPointerLeave={leavePointer}
            onFocus={openOnKeyboardFocus}
            onBlur={closeOnFocusLeaving}
            onKeyDown={closeOnEscape}
        >
            <div className="lumo-pet-cat-slot pointer-events-none">
                <Button
                    shape="ghost"
                    icon
                    className="lumo-pet-cat-button p-0"
                    onClick={onToggle}
                    aria-label={c('Action').t`Toggle ${LUMO_SHORT_APP_NAME}`}
                    aria-controls="drawer-app-lumo"
                    aria-expanded={isPanelOpen}
                >
                    <CatSprite pose={pose} isMirrored={false} />
                </Button>
            </div>
            <LumoPetMenu
                side={side}
                onMove={leavePointerThen(onMove)}
                onDock={onDock}
                conversationActions={getConversationActions({
                    hasConversation,
                    clear: leavePointerThen(onNewChat),
                    openDebugReport: openDebugReport && leavePointerThen(openDebugReport),
                })}
            />
        </div>
    );
};

export default LumoPet;
