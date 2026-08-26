import { useMeetSelector } from '@proton/meet/store/hooks';
import type { BackgroundEffect } from '@proton/meet/store/slices/backgroundSlice';
import { selectBackgroundBlur, selectVirtualBackgroundId } from '@proton/meet/store/slices/backgroundSlice';
import type { VirtualBackgroundId } from '@proton/meet/utils/virtualBackgrounds';
import { useFlag } from '@proton/unleash/useFlag';

export const useVirtualBackgroundId = (): VirtualBackgroundId | null => {
    const isVirtualBackgroundEnabled = useFlag('MeetVirtualBackground');
    const virtualBackgroundId = useMeetSelector(selectVirtualBackgroundId);

    return isVirtualBackgroundEnabled ? virtualBackgroundId : null;
};

export const useAppliedBackgroundEffect = (): BackgroundEffect => {
    const virtualBackgroundId = useVirtualBackgroundId();
    const backgroundBlur = useMeetSelector(selectBackgroundBlur);

    return virtualBackgroundId ?? (backgroundBlur ? 'blur' : 'none');
};
