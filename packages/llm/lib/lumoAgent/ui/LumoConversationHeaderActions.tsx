import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcBroom } from '@proton/icons/icons/IcBroom';
import { IcBug } from '@proton/icons/icons/IcBug';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

interface Props {
    hasConversation: boolean;
    clear: () => void;
    getDebugTranscript: () => string;
}

/** Shared so every host's header uses the same debug-transcript and clear actions. */
export const LumoConversationHeaderActions = ({ hasConversation, clear, getDebugTranscript }: Props) => {
    const { createNotification } = useNotifications();

    if (!hasConversation) {
        return null;
    }

    const copyTranscript = () => {
        textToClipboard(getDebugTranscript());
        createNotification({ text: c('Info').t`Debug transcript copied` });
    };

    const copyLabel = c('Action').t`Copy debug transcript`;
    const clearLabel = c('Action').t`Clear conversation`;

    return (
        <>
            <Tooltip title={copyLabel}>
                <Button icon color="weak" shape="ghost" onClick={copyTranscript}>
                    <IcBug alt={copyLabel} />
                </Button>
            </Tooltip>
            <Tooltip title={clearLabel}>
                <Button icon color="weak" shape="ghost" onClick={clear}>
                    <IcBroom alt={clearLabel} />
                </Button>
            </Tooltip>
        </>
    );
};
