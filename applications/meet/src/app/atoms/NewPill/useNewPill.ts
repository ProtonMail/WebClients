import { useCallback, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectUserId } from '@proton/meet/store/slices/userSlice';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const getNewPillStorageKey = (pillKey: string, userId?: string) =>
    userId ? `user.${userId}.newPill.${pillKey}` : `guest.newPill.${pillKey}`;

export const useNewPill = (key: string) => {
    const userId = useMeetSelector(selectUserId);

    const newPillKey = getNewPillStorageKey(key, userId);

    const [isNew, setIsNew] = useState(() => getItem(newPillKey) !== 'false');

    const markNewPillAsRead = useCallback(() => {
        if (!isNew) {
            return;
        }

        setItem(newPillKey, 'false');

        setIsNew(false);
    }, [isNew, newPillKey]);

    return { isNew, markNewPillAsRead };
};
