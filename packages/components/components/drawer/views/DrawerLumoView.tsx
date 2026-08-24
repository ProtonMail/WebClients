import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcBroom } from '@proton/icons/icons/IcBroom';
import { IcBug } from '@proton/icons/icons/IcBug';
import LumoWordmark from '@proton/lumo-ui/LumoWordmark';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';

import { useTheme } from '../../../containers/themes/ThemeProvider';
import useNotifications from '../../../hooks/useNotifications';
import LumoAgentPanel from '../../lumoAgent/LumoAgentPanel';
import type { SelectedDrawerOption } from './DrawerView';
import DrawerView from './DrawerView';
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
        getDebugTranscript,
    } = useLumoAgentDrawer();
    const theme = useTheme();
    const { createNotification } = useNotifications();

    const tab: SelectedDrawerOption = {
        text: LUMO_SHORT_APP_NAME,
        value: 'lumo',
    };

    const copyTranscript = () => {
        textToClipboard(getDebugTranscript());
        createNotification({ text: c('Info').t`Debug transcript copied` });
    };

    const clearLabel = c('Action').t`Clear conversation`;
    const copyLabel = c('Action').t`Copy debug transcript`;
    const headerActions = hasConversation ? (
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
