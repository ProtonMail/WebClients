import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcBroom } from '@proton/icons/icons/IcBroom';
import { IcBug } from '@proton/icons/icons/IcBug';

interface Props {
    hasConversation: boolean;
    clear: () => void;
    /** Drafts a report carrying the debug transcript. Absent in a host with no composer to open. */
    openDebugReport?: () => void;
}

/** Shared so every host's header uses the same report and clear actions. */
export const LumoConversationHeaderActions = ({ hasConversation, clear, openDebugReport }: Props) => {
    if (!hasConversation) {
        return null;
    }

    const reportLabel = c('Action').t`Report a problem`;
    const clearLabel = c('Action').t`Clear conversation`;

    return (
        <>
            {openDebugReport && (
                <Tooltip title={reportLabel}>
                    <Button icon color="weak" shape="ghost" onClick={openDebugReport}>
                        <IcBug alt={reportLabel} />
                    </Button>
                </Tooltip>
            )}
            <Tooltip title={clearLabel}>
                <Button icon color="weak" shape="ghost" onClick={clear}>
                    <IcBroom alt={clearLabel} />
                </Button>
            </Tooltip>
        </>
    );
};
