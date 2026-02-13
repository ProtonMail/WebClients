import { useEffect } from 'react';

import { useGetMeetUserSettings } from '@proton/meet/store/hooks/useMeetUserSettings';
import useFlag from '@proton/unleash/useFlag';

import { MeetingListStatus, useMeetingList } from './useMeetingList';

const useAuthenticatedDependencySetup = () => {
    const [meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting, meetingsListStatus] =
        useMeetingList();
    const getUserSettings = useGetMeetUserSettings();

    useEffect(() => {
        if (personalMeeting) {
            void getUserSettings();
        }
    }, [personalMeeting]);

    return { meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting, meetingsListStatus };
};

const useUnauthenticatedDependencySetup = () => {
    return {
        meetings: null,
        personalMeeting: null,
        setupNewPersonalMeeting: () => null,
        loadingRotatePersonalMeeting: false,
        meetingsListStatus: MeetingListStatus.Done,
    };
};

export const useDependencySetup = (isGuest: boolean) => {
    const isEarlyAccess = useFlag('MeetEarlyAccess');
    const useSetup = isGuest || !isEarlyAccess ? useUnauthenticatedDependencySetup : useAuthenticatedDependencySetup;

    return useSetup();
};
