import { useEffect } from 'react';

import { useGetUserSettings } from '../store';
import { useMeetingList } from './useMeetingList';

const useAuthenticatedDependencySetup = () => {
    const [meetings, personalMeeting] = useMeetingList();
    const getUserSettings = useGetUserSettings();

    useEffect(() => {
        if (personalMeeting) {
            void getUserSettings();
        }
    }, [personalMeeting]);

    return { meetings, personalMeeting };
};

const useUnauthenticatedDependencySetup = () => {
    return { meetings: null, personalMeeting: null };
};

export const useDependencySetup = (isGuest: boolean) => {
    const useSetup = isGuest ? useUnauthenticatedDependencySetup : useAuthenticatedDependencySetup;

    return useSetup();
};
