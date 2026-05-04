import { type Dispatch, type SetStateAction, useState } from 'react';

import { getItem } from '@proton/shared/lib/helpers/storage';

import { getRandomParticipantName } from '../utils/getRandomParticipantName';
import { getDisplayNameStorageKey } from '../utils/storage';
import { defaultDisplayNameHooks } from './useDefaultDisplayName';

interface UseDisplayNameParams {
    isGuest: boolean;
    userId?: string;
    isInstantJoin?: boolean;
}

export const useDisplayName = ({
    isGuest,
    userId,
    isInstantJoin,
}: UseDisplayNameParams): { displayName: string; setDisplayName: Dispatch<SetStateAction<string>> } => {
    const useDefaultDisplayName = isGuest
        ? defaultDisplayNameHooks.unauthenticated
        : defaultDisplayNameHooks.authenticated;
    const storedDisplayName = getItem(getDisplayNameStorageKey(isGuest, userId));

    const defaultDisplayName = useDefaultDisplayName();

    const [displayName, setDisplayName] = useState(
        storedDisplayName || (isInstantJoin ? getRandomParticipantName() : defaultDisplayName)
    );

    return { displayName, setDisplayName };
};
