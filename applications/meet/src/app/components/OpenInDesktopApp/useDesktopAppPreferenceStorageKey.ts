import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsGuest, selectUserId } from '@proton/meet/store/slices/userSlice';

import { getOpenInDesktopAppStorageKey } from '../../utils/storage';

export const useDesktopAppPreferenceStorageKey = () => {
    const isGuest = useMeetSelector(selectIsGuest);
    const userId = useMeetSelector(selectUserId);

    return getOpenInDesktopAppStorageKey(isGuest, userId);
};
