import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcBug } from '@proton/icons/icons/IcBug';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';

interface Props {
    hasConversation: boolean;
    clear: () => void;
    /** Drafts a report carrying the debug transcript. Absent in a host with no composer to open. */
    openDebugReport?: () => void;
}

interface ConversationAction {
    label: string;
    icon: ReactNode;
    onClick: () => void;
}

/** Shared so every host surface offers the same report and new-chat actions, in the same order. */
export const getConversationActions = ({ hasConversation, clear, openDebugReport }: Props): ConversationAction[] => {
    if (!hasConversation) {
        return [];
    }

    const newChatLabel = c('Action').t`New chat`;
    const newChat = { label: newChatLabel, icon: <IcPenSquare alt={newChatLabel} />, onClick: clear };
    if (!openDebugReport) {
        return [newChat];
    }

    const reportLabel = c('Action').t`Report a problem`;
    return [{ label: reportLabel, icon: <IcBug alt={reportLabel} />, onClick: openDebugReport }, newChat];
};

export const LumoConversationHeaderActions = (props: Props) => {
    return (
        <>
            {getConversationActions(props).map(({ label, icon, onClick }) => (
                <Tooltip key={label} title={label}>
                    <Button icon color="weak" shape="ghost" onClick={onClick}>
                        {icon}
                    </Button>
                </Tooltip>
            ))}
        </>
    );
};
