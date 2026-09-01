import { useMeetSelector } from '@proton/meet/store/hooks';
import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import {
    selectBackgroundBlur,
    selectCustomBackgroundId,
    selectVirtualBackgroundId,
} from '@proton/meet/store/slices/backgroundSlice';
import { toCustomBackgroundEffect } from '@proton/meet/utils/customBackgrounds';
import type { VirtualBackgroundId } from '@proton/meet/utils/virtualBackgrounds';
import { useFlag } from '@proton/unleash/useFlag';

export const useVirtualBackgroundId = (): VirtualBackgroundId | null => {
    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');
    const virtualBackgroundId = useMeetSelector(selectVirtualBackgroundId);

    return isVirtualBackgroundEnabled ? virtualBackgroundId : null;
};

export const useCustomBackgroundId = (): string | null => {
    const isCustomBackgroundEnabled = useFlag('MeetCustomVirtualBackground');
    const customBackgroundId = useMeetSelector(selectCustomBackgroundId);

    return isCustomBackgroundEnabled ? customBackgroundId : null;
};

export const useAppliedBackgroundEffect = (): BackgroundEffect => {
    const virtualBackgroundId = useVirtualBackgroundId();
    const customBackgroundId = useCustomBackgroundId();
    const backgroundBlur = useMeetSelector(selectBackgroundBlur);

    if (customBackgroundId) {
        return toCustomBackgroundEffect(customBackgroundId);
    }

    return virtualBackgroundId ?? (backgroundBlur ? 'blur' : 'none');
};
