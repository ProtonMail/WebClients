import type { VirtualBackgroundId } from './virtualBackgrounds';
import { isVirtualBackgroundId } from './virtualBackgrounds';

const VIRTUAL_BACKGROUND_KEY = 'meetVirtualBackground';

export const getPersistedVirtualBackground = (): VirtualBackgroundId | null => {
    const persistedVirtualBackground = localStorage.getItem(VIRTUAL_BACKGROUND_KEY);

    return isVirtualBackgroundId(persistedVirtualBackground) ? persistedVirtualBackground : null;
};

export const persistVirtualBackground = (virtualBackgroundId: VirtualBackgroundId | null) => {
    if (virtualBackgroundId === null) {
        localStorage.removeItem(VIRTUAL_BACKGROUND_KEY);
        return;
    }

    localStorage.setItem(VIRTUAL_BACKGROUND_KEY, virtualBackgroundId);
};
