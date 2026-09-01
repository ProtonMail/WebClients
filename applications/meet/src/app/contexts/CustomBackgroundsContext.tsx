import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectCustomBackgroundId } from '@proton/meet/store/slices/backgroundSlice';
import noop from '@proton/utils/noop';

import type { CustomBackgroundsActions } from '../hooks/useCustomBackgrounds';
import { useCustomBackgrounds } from '../hooks/useCustomBackgrounds';
import { useBackgroundEffectsContext } from './BackgroundEffects/BackgroundEffectsContext';

/** Keeps the picker renderable outside the provider and with the flag off. */
const noActions: CustomBackgroundsActions = {
    addBackground: async () => undefined,
    deleteBackground: async () => undefined,
    ensureLoaded: noop,
};

export const CustomBackgroundsContext = createContext<CustomBackgroundsActions>(noActions);

export const CustomBackgroundsProvider = ({ children }: { children: ReactNode }) => {
    const { selectBackgroundEffect } = useBackgroundEffectsContext();
    const appliedCustomBackgroundId = useMeetSelector(selectCustomBackgroundId);

    const actions = useCustomBackgrounds({ selectBackgroundEffect, appliedCustomBackgroundId });

    return <CustomBackgroundsContext.Provider value={actions}>{children}</CustomBackgroundsContext.Provider>;
};

export const useCustomBackgroundsContext = () => useContext(CustomBackgroundsContext);
