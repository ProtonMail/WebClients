import { useLayoutEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useMeetErrorReporting } from '@proton/meet';
import { useMeetDispatch } from '@proton/meet/store/hooks';
import { setCurrentMeeting, setNavigationSeed } from '@proton/meet/store/slices/currentMeeting';
import { meetingInfoThunk } from '@proton/meet/store/slices/meetingInfoModel';
import { hydrateMeetingPolicies, setWaitingRoomSetting } from '@proton/meet/store/slices/settings';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import type { JoinLocationState } from '../../types';
import { MeetingErrorKind, classifyMeetingError } from '../../utils/classifyMeetingError';
import { isExpectedApiFailure } from '../../utils/isExpectedApiFailure';
import { useInvalidMeetingLink } from './useInvalidMeetingLink';

/**
 * Resolves the meeting info for the prejoin.
 *
 * The request is normally already in flight from the bootstrap preload, so dispatching the thunk here
 * hits the cache instead of firing a second one.
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

    const { reportMeetError } = useMeetErrorReporting();

    const [isReadyToDecrypt, setIsReadyToDecrypt] = useState(false);

    const { handleInvalidMeetingLink } = useInvalidMeetingLink();

    // Check meeting details from the join state, only exist when navigating from the dashboard.
    const { state: joinState } = useLocation<JoinLocationState | undefined>();
    const navigationDetails = joinState?.meetingDetails;

    useLayoutEffect(() => {
        if (instantMeeting) {
            dispatch(setCurrentMeeting({ isMeetingLoading: false }));
            setIsReadyToDecrypt(true);
            return;
        }

        if (navigationDetails) {
            dispatch(
                setNavigationSeed({
                    meetingName: navigationDetails.meetingName,
                    isPersonalRoom: navigationDetails.isPersonalRoom,
                    canManageWaitingRoom: navigationDetails.canManageWaitingRoom,
                })
            );
            dispatch(setCurrentMeeting({ isMeetingLoading: false }));
            dispatch(setWaitingRoomSetting(navigationDetails.waitingRoom));
            setIsReadyToDecrypt(true);
        }

        if (!meetingPassword) {
            dispatch(setCurrentMeeting({ isMeetingLoading: false }));
            setIsReadyToDecrypt(true);
            return;
        }

        const resolveMeetingInfo = async () => {
            try {
                const { meetingInfo } = await dispatch(meetingInfoThunk({ meetingLinkName, meetingPassword }));

                dispatch(hydrateMeetingPolicies(meetingInfo));
                setIsReadyToDecrypt(true);
            } catch (error) {
                // Only a meeting that no longer exists justifies sending the user away
                if (classifyMeetingError(error) === MeetingErrorKind.MeetingGone) {
                    handleInvalidMeetingLink();

                    return;
                }

                if (!isExpectedApiFailure(error)) {
                    const { code, message } = getApiError(error);

                    reportMeetError(`Failed to resolve meeting info: ${code} - ${message}`, {
                        context: { error },
                        tags: { meetingLinkName },
                    });
                }

                // Anything else can be transient, keep the prejoin usable and let the join fetch again
                setIsReadyToDecrypt(true);
            } finally {
                dispatch(setCurrentMeeting({ isMeetingLoading: false }));
            }
        };

        void resolveMeetingInfo();
    }, [
        dispatch,
        instantMeeting,
        navigationDetails,
        meetingPassword,
        meetingLinkName,
        reportMeetError,
        handleInvalidMeetingLink,
    ]);

    return { isReadyToDecrypt };
};
