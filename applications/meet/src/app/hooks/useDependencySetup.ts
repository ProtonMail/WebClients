import { useEffect } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { useGetMeetUserSettings } from '@proton/meet/store/hooks/useMeetUserSettings';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { useFlag } from '@proton/unleash/useFlag';

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

export const useDependencySetup = () => {
    const isEarlyAccess = useFlag('MeetEarlyAccess');
    const isGuest = useMeetSelector(selectIsGuest);
    const useSetup = isGuest || !isEarlyAccess ? useUnauthenticatedDependencySetup : useAuthenticatedDependencySetup;

    return useSetup();
};
