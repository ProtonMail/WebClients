import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import LumoAgentDrawerContext from '@proton/components/components/drawer/views/lumoAgent/lumoAgentDrawerContext';
import useLumoAgent from '@proton/components/components/lumoAgent/useLumoAgent';

import { buildLumoDriveConfig } from '../registry';

interface Props {
    children: ReactNode;
}

/**
 * Stands up the Lumo assistant for Drive. It builds Drive's config from {@link buildLumoDriveConfig}
 * (chat plus the Drive tool pack) and exposes the conversation to {@link DrawerLumoView} via
 * context — without it, opening the Lumo drawer tab finds no provider and `useLumoAgentDrawer` throws.
 * Mounted above the drawer (see DriveWindow) so the conversation survives drawer tab switches, and only
 * when `DriveWebLumo` is on.
 */
const LumoDriveProvider = ({ children }: Props) => {
    const { pathname } = useLocation();

    // Latest route, refreshed every render, so the once-built handlers read the current one when a tool
    // runs (mirrors LumoMailProvider's ref pattern).
    const latestPathname = useRef(pathname);
    latestPathname.current = pathname;

    const config = useMemo(() => buildLumoDriveConfig({ getPathname: () => latestPathname.current }), []);
    const conversation = useLumoAgent(config);

    return <LumoAgentDrawerContext.Provider value={conversation}>{children}</LumoAgentDrawerContext.Provider>;
};

export default LumoDriveProvider;
