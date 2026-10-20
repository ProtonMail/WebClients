import type { AnimationEvent, FocusEvent, KeyboardEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getConversationActions } from '@proton/llm/lib/lumoAgent/ui/LumoConversationHeaderActions';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';
import { isAgentGenerating } from '@proton/llm/lib/lumoAgent/ui/pendingConfirm';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { PanelSide } from '../floating/panelSide';
import CatSprite from './CatSprite';
import LumoPetMenu from './LumoPetMenu';
import { selectCatPose } from './catPose';
import { useCatActivity } from './useCatActivity';
import type { CatMotion } from './useCatMotion';
import { useCelebration } from './useCelebration';

import './LumoPet.scss';

interface CatActions {
    onToggle: () => void;
    onMove: () => void;
    onDock: () => void;
    onNewChat: () => void;
    onHide: () => void;
    onReveal: () => void;
}

interface Props {
    side: PanelSide;
    isPanelOpen: boolean;
    isTyping: boolean;
    motion: CatMotion;
    actions: CatActions;
    onJumpEnd: () => void;
}

const LumoPet = ({ side, isPanelOpen, isTyping, motion, actions, onJumpEnd }: Props) => {
    const { run, jump, isHidden } = motion;
    const { onToggle, onMove, onDock, onNewChat, onHide, onReveal } = actions;
    const { items, isBusy, lastChainEnd, hasConversation, openDebugReport } = useLumoAgentDrawer();
    const isCelebrating = useCelebration(isBusy, lastChainEnd);
    const activity = useCatActivity(items, isBusy);
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
    const handleJumpEnd = (event: AnimationEvent) => {
        if (event.target === event.currentTarget) {
            onJumpEnd();
        }
    };

    // Named to share the composer's "Show ${title}" msgid: the i18n validator rejects one string with two variable names
    const title = LUMO_SHORT_APP_NAME;
    const canShowMenu = !isHidden && !run && !jump;
    const hasSidedPose = Boolean(run);
    const pose = selectCatPose({
        jump,
        isHidden,
        run,
        isHovered,
        isChatOpen: isPanelOpen,
        activity,
        isThinking: isAgentGenerating(items, isBusy),
        isCelebrating,
        isTyping,
        side,
    });

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            className={clsx('lumo-pet-dock relative', canShowMenu && isMenuOpen && 'lumo-pet-dock--menu-open')}
            onPointerEnter={enterPointer}
            onPointerLeave={leavePointer}
            onFocus={openOnKeyboardFocus}
            onBlur={closeOnFocusLeaving}
            onKeyDown={closeOnEscape}
        >
            <div
                className={clsx(
                    'lumo-pet-cat-slot pointer-events-none',
                    isHidden && 'lumo-pet-cat-slot--hidden',
                    jump && `lumo-pet-cat-slot--jump-${jump}`
                )}
                onAnimationEnd={handleJumpEnd}
            >
                <Button
                    shape="ghost"
                    icon
                    className="lumo-pet-cat-button"
                    onClick={isHidden ? onReveal : onToggle}
                    aria-label={isHidden ? c('Action').t`Show ${title}` : c('Action').t`Toggle ${LUMO_SHORT_APP_NAME}`}
                    aria-controls="drawer-app-lumo"
                    aria-expanded={isPanelOpen}
                >
                    <CatSprite pose={pose} isMirrored={hasSidedPose && side === PanelSide.LEFT} />
                </Button>
            </div>
            {canShowMenu && (
                <LumoPetMenu
                    side={side}
                    onMove={leavePointerThen(onMove)}
                    onDock={onDock}
                    onHide={leavePointerThen(onHide)}
                    conversationActions={getConversationActions({
                        hasConversation,
                        clear: leavePointerThen(onNewChat),
                        openDebugReport: openDebugReport && leavePointerThen(openDebugReport),
                    })}
                />
            )}
        </div>
    );
};

export default LumoPet;
