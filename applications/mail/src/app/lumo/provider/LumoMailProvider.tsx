import type { ReactNode } from 'react';

import LumoAgentDrawerContext from '@proton/components/components/drawer/views/lumoAgent/lumoAgentDrawerContext';
import useLumoAgent from '@proton/components/components/lumoAgent/useLumoAgent';

import { lumoMailConfig } from '../registry';

interface Props {
    children: ReactNode;
}

/**
 * Stands up the Lumo assistant for Mail. It calls {@link useLumoAgent} with the Mail tool pack and
 * exposes the conversation to {@link DrawerLumoView} via context. Mounted above the drawer (see
 * PrivateLayout) so the conversation persists across drawer tab switches and panel open/close, and only
 * when the `LumoInMail` flag is on — flag off, this component is never rendered.
 */
const LumoMailProvider = ({ children }: Props) => {
    const conversation = useLumoAgent(lumoMailConfig);

    return (
        <LumoAgentDrawerContext.Provider value={{ ...conversation, cardRenderers: lumoMailConfig.cardRenderers }}>
            {children}
        </LumoAgentDrawerContext.Provider>
    );
};

export default LumoMailProvider;
