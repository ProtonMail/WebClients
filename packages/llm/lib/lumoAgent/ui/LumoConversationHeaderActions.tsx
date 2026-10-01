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

/** Shared so every host's header uses the same report and new-chat actions. */
export const LumoConversationHeaderActions = ({ hasConversation, clear, openDebugReport }: Props) => {
    if (!hasConversation) {
        return null;
    }

    const reportLabel = c('Action').t`Report a problem`;
    const newChatLabel = c('Action').t`New chat`;

    return (
        <>
            {openDebugReport && (
                <Tooltip title={reportLabel}>
                    <Button icon color="weak" shape="ghost" onClick={openDebugReport}>
                        <IcBug alt={reportLabel} />
                    </Button>
                </Tooltip>
            )}
            <Tooltip title={newChatLabel}>
                <Button icon color="weak" shape="ghost" onClick={clear}>
                    <IcPenSquare alt={newChatLabel} />
                </Button>
            </Tooltip>
        </>
    );
};
