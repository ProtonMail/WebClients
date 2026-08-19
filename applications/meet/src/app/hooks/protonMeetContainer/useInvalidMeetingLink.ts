import { useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { setInvalidMeetingLinkModalOpen } from '@proton/meet/store/slices/meetAppStateSlice';
import { meetingsThunk } from '@proton/meet/store/slices/meetings';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { CacheType } from '@proton/redux-utilities/interface';

import type { JoinLocationState } from '../../types';

export const useInvalidMeetingLink = () => {
    const dispatch = useMeetDispatch();
    const history = useHistory();
    const location = useLocation<JoinLocationState | undefined>();
    const isGuest = useMeetSelector(selectIsGuest);

    const hasMeetingDetails = !!location.state?.meetingDetails;

    const handleInvalidMeetingLink = useCallback(() => {
        dispatch(setInvalidMeetingLinkModalOpen(true));

        // Refresh the meeting list to remove the invalid link
        if (!isGuest && hasMeetingDetails) {
            void dispatch(meetingsThunk({ cache: CacheType.None }));
        }

        history.push('/dashboard');
    }, [dispatch, history, isGuest, hasMeetingDetails]);

    return { handleInvalidMeetingLink };
};
