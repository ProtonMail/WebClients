import type { FocusEvent, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import { IcHamburger } from '@proton/icons/icons/IcHamburger';
import { getConversationActions } from '@proton/llm/lib/lumoAgent/ui/LumoConversationHeaderActions';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { PanelSide } from './panelSide';

interface MenuChipProps {
    label: string;
    onClick: () => void;
    children: ReactNode;
}

const MenuChip = ({ label, onClick, children }: MenuChipProps) => {
    return (
        <span className="lumo-floating-panel-chip flex rounded-full">
            <Tooltip title={label} originalPlacement="left">
                <Button icon shape="ghost" color="weak" onClick={onClick}>
                    {children}
                </Button>
            </Tooltip>
        </span>
    );
};

interface Props {
    side: PanelSide;
    hasConversation: boolean;
    onReportProblem?: () => void;
    onNewChat: () => void;
    onSwitchSides: () => void;
    onDock: () => void;
}

const LumoFloatingPanelMenu = ({ side, hasConversation, onReportProblem, onNewChat, onSwitchSides, onDock }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const dockRef = useRef<HTMLDivElement>(null);
    const stackId = useId();

    const close = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const closeOnOutsidePress = (event: PointerEvent) => {
            if (!dockRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('pointerdown', closeOnOutsidePress);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePress);
        };
    }, [isOpen]);

    const closeThen = (action: () => void) => () => {
        close();
        action();
    };

    // A mouse press also focuses, but without :focus-visible, and its click must be the one that toggles
    const openOnKeyboardFocus = (event: FocusEvent<HTMLDivElement>) => {
        if (event.target.matches(':focus-visible')) {
            setIsOpen(true);
        }
    };

    const closeOnFocusLeaving = (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            close();
        }
    };

    const closeOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Escape' || !isOpen) {
            return;
        }
        event.stopPropagation();
        close();
    };

    const switchLabel = c('Action').t`Switch sides`;
    const dockLabel = c('Action').t`Dock to side panel`;
    const conversationActions = getConversationActions({
        hasConversation,
        clear: onNewChat,
        openDebugReport: onReportProblem,
    });

    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
            ref={dockRef}
            className={clsx('lumo-floating-panel-dock', isOpen && 'lumo-floating-panel-dock--open')}
            onFocus={openOnKeyboardFocus}
            onBlur={closeOnFocusLeaving}
            onKeyDown={closeOnEscape}
        >
            <Button
                icon
                shape="ghost"
                color="weak"
                className="lumo-floating-panel-hamburger"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-controls={stackId}
                onClick={() => setIsOpen((wasOpen) => !wasOpen)}
            >
                <IcHamburger size={5} alt={c('Action').t`${LUMO_SHORT_APP_NAME} actions`} />
            </Button>
            <div id={stackId} className="lumo-floating-panel-stack">
                {conversationActions.map(({ label, icon, onClick }) => (
                    <MenuChip key={label} label={label} onClick={closeThen(onClick)}>
                        {icon}
                    </MenuChip>
                ))}
                <MenuChip label={switchLabel} onClick={closeThen(onSwitchSides)}>
                    {side === PanelSide.RIGHT ? <IcArrowLeft alt={switchLabel} /> : <IcArrowRight alt={switchLabel} />}
                </MenuChip>
                <MenuChip label={dockLabel} onClick={closeThen(onDock)}>
                    <IcArrowWithinSquare alt={dockLabel} />
                </MenuChip>
            </div>
        </div>
    );
};

export default LumoFloatingPanelMenu;
