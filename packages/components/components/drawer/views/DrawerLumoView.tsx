import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import DrawerView from '@proton/components/components/drawer/views/DrawerView';
import LumoAgentPanel from '@proton/components/components/lumoAgent/LumoAgentPanel';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { IcBroom } from '@proton/icons/icons/IcBroom';
import LumoWordmark from '@proton/lumo-ui/LumoWordmark';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useLumoAgentDrawer } from './lumoAgent/lumoAgentDrawerContext';

import '@proton/lumo-ui/lumo-ui.scss';

import '../../lumoAgent/lumoAgent.scss';
import './DrawerLumoView.scss';

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
    } = useLumoAgentDrawer();
    const theme = useTheme();

    const tab: SelectedDrawerOption = {
        text: LUMO_SHORT_APP_NAME,
        value: 'lumo',
    };

    const clearLabel = c('Action').t`Clear conversation`;
    const headerActions = hasConversation ? (
        <Tooltip title={clearLabel}>
            <Button icon color="weak" shape="ghost" onClick={clear}>
                <IcBroom alt={clearLabel} />
            </Button>
        </Tooltip>
    ) : undefined;

    return (
        <DrawerView
            tab={tab}
            titleContent={<LumoWordmark dark={theme.information.dark} alt={LUMO_SHORT_APP_NAME} />}
            id="drawer-app-lumo"
            headerActions={headerActions}
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
