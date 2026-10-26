import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcArrowDown } from '@proton/icons/icons/IcArrowDown';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcArrowRight } from '@proton/icons/icons/IcArrowRight';
import { IcArrowWithinSquare } from '@proton/icons/icons/IcArrowWithinSquare';
import type { getConversationActions } from '@proton/llm/lib/lumoAgent/ui/LumoConversationHeaderActions';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { PanelSide } from '../floating/panelSide';

type MenuAction = ReturnType<typeof getConversationActions>[number];

interface MenuButtonProps {
    label: string;
    onClick: () => void;
    children: ReactNode;
}

const MenuButton = ({ label, onClick, children }: MenuButtonProps) => {
    return (
        <span className="lumo-pet-menu-button flex rounded-full border bg-norm">
            <Tooltip title={label}>
                <Button icon size="small" shape="ghost" color="weak" className="rounded-full" onClick={onClick}>
                    {children}
                </Button>
            </Tooltip>
        </span>
    );
};

interface Props {
    side: PanelSide;
    onMove: () => void;
    onDock: () => void;
    onHide: () => void;
    conversationActions: MenuAction[];
}

const LumoPetMenu = ({ side, onMove, onDock, onHide, conversationActions }: Props) => {
    const isMovingLeft = side === PanelSide.RIGHT;
    const moveLabel = isMovingLeft
        ? c('Action').t`Move ${LUMO_SHORT_APP_NAME} to the left`
        : c('Action').t`Move ${LUMO_SHORT_APP_NAME} to the right`;
    const dockLabel = c('Action').t`Dock to side panel`;
    // Named to share the composer's "Hide ${title}" msgid: the i18n validator rejects one string with two variable names
    const title = LUMO_SHORT_APP_NAME;
    const hideLabel = c('Action').t`Hide ${title}`;

    const move: MenuAction = {
        label: moveLabel,
        icon: isMovingLeft ? <IcArrowLeft alt={moveLabel} /> : <IcArrowRight alt={moveLabel} />,
        onClick: onMove,
    };
    const dockAction: MenuAction = { label: dockLabel, icon: <IcArrowWithinSquare alt={dockLabel} />, onClick: onDock };
    const hide: MenuAction = { label: hideLabel, icon: <IcArrowDown alt={hideLabel} />, onClick: onHide };

    // Listed from the cat's head upwards, the conversation actions on top so the core buttons never shift
    const actionsFromHead = [move, hide, dockAction, ...[...conversationActions].reverse()];

    return (
        <div className="lumo-pet-menu absolute start-0 end-0 flex flex-column-reverse gap-1 w-fit-content mx-auto">
            {actionsFromHead.map(({ label, icon, onClick }) => (
                <MenuButton key={label} label={label} onClick={onClick}>
                    {icon}
                </MenuButton>
            ))}
        </div>
    );
};

export default LumoPetMenu;
