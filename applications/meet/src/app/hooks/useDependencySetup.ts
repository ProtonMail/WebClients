import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { MeetingListStatus, useMeetingList } from './useMeetingList';

const useAuthenticatedDependencySetup = () => {
    const [meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting, meetingsListStatus] =
        useMeetingList();

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
