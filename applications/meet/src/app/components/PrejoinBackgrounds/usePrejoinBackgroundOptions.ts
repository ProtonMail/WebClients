import { useEffect } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { selectPendingBackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';

import { useBackgroundEffectsContext } from '../../contexts/BackgroundEffects/BackgroundEffectsContext';
import { useAppliedBackgroundEffect } from '../../contexts/BackgroundEffects/useAppliedBackgroundEffect';
import { getBackgroundEffectOptions, getVirtualBackgroundOptions } from '../Backgrounds/backgroundOptions';
import { useCustomBackgroundTiles } from '../Backgrounds/useCustomBackgroundTiles';

/**
 * The prejoin picker shows every background in a single group, unlike the sectioned side bar the
 * meeting has, so the effects, the saved backgrounds and the virtual ones are laid out in a row.
 */
export const usePrejoinBackgroundOptions = ({ tileClassName }: { tileClassName?: string } = {}) => {
    const appliedBackgroundEffect = useAppliedBackgroundEffect();
    const pendingBackgroundEffect = useMeetSelector(selectPendingBackgroundEffect);

    const { selectBackgroundEffect } = useBackgroundEffectsContext();

    const {
        options: customBackgroundOptions,
        renderActionTile,
        ensureLoaded,
    } = useCustomBackgroundTiles({ className: tileClassName });

    // Mounted only while the picker is open, so this is the moment Drive is worth asking.
    useEffect(() => {
        ensureLoaded();
    }, [ensureLoaded]);

    const effectOptions = getBackgroundEffectOptions();

    return {
        options: [...effectOptions, ...customBackgroundOptions, ...getVirtualBackgroundOptions()],
        // Saved backgrounds follow the effects, so adding one belongs right after them.
        actionTileIndex: effectOptions.length,
        renderActionTile,
        selectedEffect: pendingBackgroundEffect ?? appliedBackgroundEffect,
        pendingEffect: pendingBackgroundEffect,
        onSelect: (effect: BackgroundEffect) => {
            void selectBackgroundEffect(effect);
        },
    };
};
