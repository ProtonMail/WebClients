import { createContext } from 'react';

import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { MaybeNull, SpotlightMessage } from '@proton/pass/types';

type SpotlightState = {
    open: boolean;
    pendingShareAccess: boolean;
    message: MaybeNull<SpotlightMessageDefinition>;
};

export type SpotlightContextValue = {
    /** Acknowledges the provided spotlight message type.
     * Resets the SpotlightContext's current message to `null` */
    acknowledge: (messageType: SpotlightMessage) => void;
    /** Controls the Pending Share Access modal */
    setPendingShareAccess: (value: boolean) => void;
    /** Sets the current message - if an invite  */
    setSpotlight: (message: MaybeNull<SpotlightMessageDefinition>) => void;
    state: SpotlightState;
};

export const SpotlightContext = createContext<MaybeNull<SpotlightContextValue>>(null);

export const useSpotlight = createUseContext(SpotlightContext);
