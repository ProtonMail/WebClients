import { useEffect } from 'react';

import useFlag from '@proton/unleash/useFlag';

import { useGetMeetUserSettings } from '../store';
import { useMeetingList } from './useMeetingList';

const useAuthenticatedDependencySetup = () => {
    const [meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting] = useMeetingList();
    const getUserSettings = useGetMeetUserSettings();

    useEffect(() => {
        if (personalMeeting) {
            void getUserSettings();
        }
    }, [personalMeeting]);

    return { meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting };
};

const useUnauthenticatedDependencySetup = () => {
    return {
        meetings: null,
        personalMeeting: null,
        setupNewPersonalMeeting: () => null,
        loadingRotatePersonalMeeting: false,
    };
};

export const useDependencySetup = (isGuest: boolean) => {
    const isEarlyAccess = useFlag('MeetEarlyAccess');
    const useSetup = isGuest || !isEarlyAccess ? useUnauthenticatedDependencySetup : useAuthenticatedDependencySetup;

    return useSetup();
};
