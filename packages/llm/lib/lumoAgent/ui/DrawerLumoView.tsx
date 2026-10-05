import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { SelectedDrawerOption } from '@proton/components/components/drawer/views/DrawerView';
import DrawerView from '@proton/components/components/drawer/views/DrawerView';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';
import LumoWordmark from '@proton/lumo-ui/LumoWordmark';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import ConnectedLumoAgentPanel from './ConnectedLumoAgentPanel';
import { LumoConversationHeaderActions } from './LumoConversationHeaderActions';
import { focusLumoPrompt } from './focusLumoPrompt';
import { useLumoAgentDrawer } from './lumoAgentDrawerContext';

import './DrawerLumoView.scss';

const DrawerLumoView = () => {
    const { hasConversation, clear, openDebugReport, onDetach } = useLumoAgentDrawer();
    const theme = useTheme();
    const { toggleDrawerApp } = useDrawer();
    const closeDrawer = toggleDrawerApp({ app: DRAWER_NATIVE_APPS.LUMO });

    const tab: SelectedDrawerOption = {
        text: LUMO_SHORT_APP_NAME,
        value: 'lumo',
    };

    const detachLabel = c('Action').t`Detach`;

    return (
        <DrawerView
            tab={tab}
            titleContent={<LumoWordmark dark={theme.information.dark} alt={LUMO_SHORT_APP_NAME} />}
            id="drawer-app-lumo"
            onAnimationEnd={focusLumoPrompt}
            headerActions={
                <>
                    {onDetach && (
                        <Tooltip title={detachLabel}>
                            <Button icon color="weak" shape="ghost" onClick={onDetach}>
                                <IcArrowOutSquare className="mirror" alt={detachLabel} />
                            </Button>
                        </Tooltip>
                    )}
                    <LumoConversationHeaderActions
                        hasConversation={hasConversation}
                        clear={clear}
                        openDebugReport={openDebugReport}
                    />
                </>
            }
            contentClassName="drawer-lumo flex flex-column flex-nowrap"
        >
            <ConnectedLumoAgentPanel onClose={closeDrawer} />
        </DrawerView>
    );
};

export default DrawerLumoView;
