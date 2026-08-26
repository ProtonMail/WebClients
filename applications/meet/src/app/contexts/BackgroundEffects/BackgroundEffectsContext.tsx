import { createContext, useContext } from 'react';

import type debounce from 'lodash/debounce';

import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';

export interface BackgroundEffectsContextType {
    selectBackgroundEffect: (effect: BackgroundEffect) => Promise<void>;
    toggleBackgroundBlur: ReturnType<typeof debounce>;
}

export const BackgroundEffectsContext = createContext<BackgroundEffectsContextType | null>(null);

export const useBackgroundEffectsContext = () => {
    const context = useContext(BackgroundEffectsContext);

    if (!context) {
        throw new Error('useBackgroundEffectsContext must be used within a BackgroundEffectsContext.Provider');
    }

    return context;
};
