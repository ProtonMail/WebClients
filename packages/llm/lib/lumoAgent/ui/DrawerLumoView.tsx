import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import DrawerView from '@proton/components/components/drawer/views/DrawerView';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import LumoWordmark from '@proton/lumo-ui/LumoWordmark';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import LumoAgentPanel from './LumoAgentPanel';
import { LumoConversationHeaderActions } from './LumoConversationHeaderActions';
import { useLumoAgentDrawer } from './lumoAgentDrawerContext';

import '@proton/lumo-ui/lumo-ui.scss';

import './DrawerLumoView.scss';
import './lumoAgent.scss';

const DrawerLumoView = () => {
    const {
        items,
        isBusy,
        isAtToolLimit,
        cardRenderers,
        serverToolMeta,
        hasConversation,
        send,
        stop,
        resume,
        dismissToolLimit,
        confirm,
        cancel,
        clear,
        getDebugTranscript,
    } = useLumoAgentDrawer();
    const theme = useTheme();

    const tab: SelectedDrawerOption = {
        text: LUMO_SHORT_APP_NAME,
        value: 'lumo',
    };

    return (
        <DrawerView
            tab={tab}
            titleContent={<LumoWordmark dark={theme.information.dark} alt={LUMO_SHORT_APP_NAME} />}
            id="drawer-app-lumo"
            headerActions={
                <LumoConversationHeaderActions
                    hasConversation={hasConversation}
                    clear={clear}
                    getDebugTranscript={getDebugTranscript}
                />
            }
            contentClassName="drawer-lumo flex flex-column flex-nowrap"
        >
            <LumoAgentPanel
                items={items}
                isBusy={isBusy}
                isAtToolLimit={isAtToolLimit}
                cardRenderers={cardRenderers}
                serverToolMeta={serverToolMeta}
                onSend={send}
                onStop={stop}
                onConfirm={confirm}
                onCancel={cancel}
                onResume={resume}
                onDismissToolLimit={dismissToolLimit}
            />
        </DrawerView>
    );
};

export default DrawerLumoView;
