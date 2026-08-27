import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcCross } from '@proton/icons/icons/IcCross';
import LumoWordmark from '@proton/lumo-ui/LumoWordmark';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import LumoAgentPanel from '../../components/lumoAgent/LumoAgentPanel';
import { LumoConversationHeaderActions } from '../../components/lumoAgent/LumoConversationHeaderActions';
import type { LumoAgentConfig } from '../../components/lumoAgent/types';
import useLumoAgent from '../../components/lumoAgent/useLumoAgent';
import { useTheme } from '../themes/ThemeProvider';

import '@proton/lumo-ui/lumo-ui.scss';

import '../../components/lumoAgent/lumoAgent.scss';

// TODO: the conversation lives in this component's state, so it lasts as long as the file stays open.
// Persist it the way Lumo's own history does (encrypted, server-side) rather than putting file contents
// in browser storage.

interface Props {
    config: LumoAgentConfig;
    onClose: () => void;
}

/**
 * The assistant side panel for the file open in the preview. One conversation per file: the caller keys
 * this component on the file, so moving to another one starts fresh.
 *
 * It draws its own header because the panel is not wrapped in `DrawerView` — same wordmark and actions as
 * {@link DrawerLumoView}, plus a close button of its own (DrawerView's closes the app-wide drawer).
 */
export const FilePreviewAssistant = ({ config, onClose }: Props) => {
    const {
        items,
        isBusy,
        isAtToolLimit,
        hasConversation,
        send,
        stop,
        resume,
        dismissToolLimit,
        confirm,
        cancel,
        clear,
        getDebugTranscript,
    } = useLumoAgent(config);
    const theme = useTheme();

    const closeLabel = c('Action').t`Close`;

    return (
        <div id="lumo-side-panel" className="flex flex-column flex-nowrap h-full overflow-hidden">
            <div className="flex flex-nowrap items-center justify-space-between gap-2 p-2 border-bottom border-weak">
                <LumoWordmark dark={theme.information.dark} alt={LUMO_SHORT_APP_NAME} />
                <div className="flex flex-nowrap items-center">
                    <LumoConversationHeaderActions
                        hasConversation={hasConversation}
                        clear={clear}
                        getDebugTranscript={getDebugTranscript}
                    />
                    <Tooltip title={closeLabel}>
                        <Button icon color="weak" shape="ghost" onClick={onClose}>
                            <IcCross alt={closeLabel} />
                        </Button>
                    </Tooltip>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <LumoAgentPanel
                    items={items}
                    isBusy={isBusy}
                    isAtToolLimit={isAtToolLimit}
                    cardRenderers={config.cardRenderers}
                    serverToolMeta={config.serverToolMeta}
                    onSend={send}
                    onStop={stop}
                    onConfirm={confirm}
                    onCancel={cancel}
                    onResume={resume}
                    onDismissToolLimit={dismissToolLimit}
                />
            </div>
        </div>
    );
};
