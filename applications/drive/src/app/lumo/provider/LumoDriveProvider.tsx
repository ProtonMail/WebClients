import type { ReactNode } from 'react';

import LumoAgentDrawerContext from '@proton/components/components/drawer/views/lumoAgent/lumoAgentDrawerContext';
import useLumoAgent from '@proton/components/components/lumoAgent/useLumoAgent';

import { useLumoDriveConfig } from '../useLumoDriveConfig';

interface Props {
    children: ReactNode;
}

/**
 * Stands up the Lumo assistant for Drive. It builds Drive's config from {@link useLumoDriveConfig}
 * (chat plus the Drive tool pack) and exposes the conversation to {@link DrawerLumoView} via
 * context — without it, opening the Lumo drawer tab finds no provider and `useLumoAgentDrawer` throws.
 * Mounted above the drawer (see DriveWindow) so the conversation survives drawer tab switches, and only
 * when `DriveWebLumo` is on.
 */
const LumoDriveProvider = ({ children }: Props) => {
    const config = useLumoDriveConfig();
    const conversation = useLumoAgent(config);

    return <LumoAgentDrawerContext.Provider value={conversation}>{children}</LumoAgentDrawerContext.Provider>;
};

export default LumoDriveProvider;
