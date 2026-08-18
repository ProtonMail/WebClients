import { createContext, useContext } from 'react';

import type { CardRenderers, LumoAgentItem, ServerToolMeta } from '@proton/components/components/lumoAgent/types';
import type { ToolName as ServerToolName } from '@proton/lumo-api-client';

/**
 * The conversation surface exposed by `useLumoAgent`, plus the product's render config. It bridges the
 * product-side provider (which owns the hook, mounted high so the conversation survives tab switches)
 * to {@link DrawerLumoView} (which lives in this package and can't import the product). Declared here —
 * the lowest layer both sides share — so the view stays product-blind.
 */
export interface LumoAgentDrawerValue {
    items: LumoAgentItem[];
    isBusy: boolean;
    isAtToolLimit: boolean;
    hasConversation: boolean;
    send: (text: string) => void;
    resume: () => void;
    dismissToolLimit: () => void;
    confirm: (params: Record<string, any>) => void;
    cancel: () => void;
    stop: () => void;
    clear: () => void;
    getDebugTranscript: () => string;
    cardRenderers?: CardRenderers;
    serverToolMeta?: Partial<Record<ServerToolName, ServerToolMeta>>;
}

const LumoAgentDrawerContext = createContext<LumoAgentDrawerValue | null>(null);

export const useLumoAgentDrawer = (): LumoAgentDrawerValue => {
    const value = useContext(LumoAgentDrawerContext);
    if (!value) {
        throw new Error('useLumoAgentDrawer must be used within a product Lumo provider (e.g. LumoMailProvider)');
    }
    return value;
};

export default LumoAgentDrawerContext;
