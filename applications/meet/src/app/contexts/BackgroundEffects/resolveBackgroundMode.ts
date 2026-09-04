import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { resolveBackgroundSource } from '@proton/meet/utils/customBackgrounds';

import type { BackgroundMode } from '../../processors/background-processor/types';

// A custom background is decrypted out of the cache, and possibly downloaded
// from Drive, so this can take a while.
export const resolveBackgroundMode = async (
    effect: Exclude<BackgroundEffect, 'none'>
): Promise<BackgroundMode | null> => {
    if (effect === 'blur') {
        return { type: 'blur' };
    }

    const source = await resolveBackgroundSource(effect);

    return source ? { type: 'image', ...source } : null;
};
