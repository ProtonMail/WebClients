import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setMeetingInfo } from '@proton/meet/store/slices/meetingInfo';
import { setWaitingRoomSetting } from '@proton/meet/store/slices/settings';

import type { JoinLocationState } from '../../types';
import { getPreloadedMeetingDetails } from '../../utils/meetingDetailsPreload';
import { useMeetingAuthentication } from '../srp/useMeetingAuthentication';

/**
 * Resolves the meeting details for the prejoin and puts them in the redux store.
 *
 * The request is normally already in flight from the bootstrap preload, so this awaits that cache and
 * only falls back to the API when it is missing or failed.
 */
export const useMeetingInfoHydration = ({
    meetingLinkName,
    meetingPassword,
    instantMeeting,
}: {
    meetingLinkName: string;
    meetingPassword: string;
    instantMeeting: boolean;
}) => {
    const dispatch = useMeetDispatch();

    const { getMeetingDetails, initHandshake } = useMeetingAuthentication();

    // Check meeting details from the join state, only exist when navigating from the dashboard.
    const { state: joinState } = useLocation<JoinLocationState | undefined>();
    const navigationDetails = joinState?.meetingDetails;

    useLayoutEffect(() => {
        if (instantMeeting) {
            dispatch(setMeetingInfo({ isMeetingLoading: false }));
            return;
        }

        if (navigationDetails) {
            dispatch(
                setMeetingInfo({
                    meetingName: navigationDetails.meetingName,
                    isPersonalRoom: navigationDetails.isPersonalRoom,
                    canManageWaitingRoom: navigationDetails.canManageWaitingRoom,
                    isMeetingLoading: false,
                })
            );
            dispatch(setWaitingRoomSetting(navigationDetails.waitingRoom));
        }

        if (!meetingPassword) {
            dispatch(setMeetingInfo({ isMeetingLoading: false }));
            return;
        }

        const fetchFromApi = async () => {
            const handshakeInfo = await initHandshake(meetingLinkName);
            return getMeetingDetails({
                urlPassword: meetingPassword,
                token: meetingLinkName,
                handshakeInfo,
            });
        };

        const resolveMeetingDetails = async () => {
            try {
                const preloaded = await getPreloadedMeetingDetails(meetingLinkName)?.catch(() => undefined);

                const { roomName, isPersonalRoom, waitingRoom, canManageWaitingRoom } =
                    preloaded ?? (await fetchFromApi());

                dispatch(setMeetingInfo({ meetingName: roomName, isPersonalRoom, canManageWaitingRoom }));
                dispatch(setWaitingRoomSetting(waitingRoom));
            } finally {
                dispatch(setMeetingInfo({ isMeetingLoading: false }));
            }
        };

        void resolveMeetingDetails();
    }, [
        dispatch,
        getMeetingDetails,
        initHandshake,
        instantMeeting,
        navigationDetails,
        meetingPassword,
        meetingLinkName,
    ]);
};
