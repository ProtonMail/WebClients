import type { ReactNode } from 'react';
import { useMemo } from 'react';

import LumoAgentDrawerContext from '@proton/components/components/drawer/views/lumoAgent/lumoAgentDrawerContext';
import useLumoAgent from '@proton/components/components/lumoAgent/useLumoAgent';

import { buildLumoDriveConfig } from '../registry';

interface Props {
    children: ReactNode;
}

/**
 * Stands up the Lumo assistant for Drive. It builds Drive's config from {@link buildLumoDriveConfig}
 * (chat only until a tool pack lands) and exposes the conversation to {@link DrawerLumoView} via
 * context — without it, opening the Lumo drawer tab finds no provider and `useLumoAgentDrawer` throws.
 * Mounted above the drawer (see DriveWindow) so the conversation survives drawer tab switches, and only
 * when `DriveWebLumo` is on.
 */
const LumoDriveProvider = ({ children }: Props) => {
    const config = useMemo(buildLumoDriveConfig, []);
    const conversation = useLumoAgent(config);

    return <LumoAgentDrawerContext.Provider value={conversation}>{children}</LumoAgentDrawerContext.Provider>;
};

export default LumoDriveProvider;
