import { useEffect } from 'react';

import { useFlag } from '@proton/unleash/useFlag';

import { openDesktopAppOnPreJoin } from '../../utils/openDesktopAppOnLoad';
import { useDesktopAppPreferenceStorageKey } from './useDesktopAppPreferenceStorageKey';

export const useOpenDesktopAppOnPreJoin = () => {
    const desktopAppPreferenceStorageKey = useDesktopAppPreferenceStorageKey();
    const isOpenDesktopAppOnLoadEnabled = useFlag('MeetOpenDesktopAppOnLoad');

    useEffect(() => {
        openDesktopAppOnPreJoin({ isOpenDesktopAppOnLoadEnabled, desktopAppPreferenceStorageKey });
    }, [isOpenDesktopAppOnLoadEnabled, desktopAppPreferenceStorageKey]);
};
