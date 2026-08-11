import type { ReactNode } from 'react';
import { useMemo } from 'react';

import LumoAgentDrawerContext from '@proton/components/components/drawer/views/lumoAgent/lumoAgentDrawerContext';
import type { LumoAgentConfig } from '@proton/components/components/lumoAgent/types';
import useLumoAgent from '@proton/components/components/lumoAgent/useLumoAgent';

interface Props {
    children: ReactNode;
}

/**
 * Stands up the Lumo assistant for Drive. Drive has no tool pack yet (see
 * `proton-mail/lumo/registry.ts` for the pattern a `buildLumoDriveConfig` would follow), so this hands
 * `useLumoAgent` a chat-only config and exposes it to {@link DrawerLumoView} via context — without it,
 * opening the Lumo drawer tab finds no provider and `useLumoAgentDrawer` throws. Mounted above the
 * drawer (see DriveWindow) so the conversation survives drawer tab switches, and only when
 * `DriveWebLumo` is on.
 */
const LumoDriveProvider = ({ children }: Props) => {
    const config = useMemo((): LumoAgentConfig => ({ definitions: [], handlers: {} }), []);
    const conversation = useLumoAgent(config);

    return <LumoAgentDrawerContext.Provider value={conversation}>{children}</LumoAgentDrawerContext.Provider>;
};

export default LumoDriveProvider;
