import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import {
    type CreateMeetingParams,
    getMeetingLink,
    useGetMeetingDependencies,
    useMeetErrorReporting,
} from '@proton/meet';
import { useIsWaitingRoomCreationEnabled } from '@proton/meet/hooks/useWaitingRoomFlags';
import { prepareMeetingCryptoData } from '@proton/meet/utils/cryptoUtils';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { rotatePersonalMeetingLink } from '@proton/shared/lib/api/meet';
import type { RotatePersonalMeetingResponse } from '@proton/shared/lib/interfaces/Meet';
import {
    CustomPasswordState,
    MeetingType,
    ProtonCalendarState,
    WaitingRoomState,
} from '@proton/shared/lib/interfaces/Meet';

export const useRotatePersonalMeetingLink = () => {
    const isWaitingRoomCreationEnabled = useIsWaitingRoomCreationEnabled();

    const api = useApi();

    const { reportMeetError } = useMeetErrorReporting();

    const getMeetingDependencies = useGetMeetingDependencies();

    const rotatePersonalMeeting = async ({ meetingName }: CreateMeetingParams) => {
        const { privateKey, addressId } = await getMeetingDependencies();

        const {
            encryptedMeetingName,
            encryptedSessionKey,
            encryptedPassword,
            urlPasswordSalt,
            srpVerifier,
            srpModulusID,
            salt,
            passwordBase,
        } = await prepareMeetingCryptoData({
            primaryUserKey: privateKey,
            meetingName,
            api,
        });

        try {
            const response = await api<RotatePersonalMeetingResponse>(
                rotatePersonalMeetingLink({
                    Name: encryptedMeetingName,
                    Password: encryptedPassword,
                    Salt: salt,
                    SessionKey: encryptedSessionKey,
                    SRPModulusID: srpModulusID,
                    SRPSalt: urlPasswordSalt,
                    SRPVerifier: srpVerifier,
                    AddressID: addressId,
                    StartTime: null,
                    EndTime: null,
                    RRule: null,
                    Timezone: null,
                    CustomPassword: CustomPasswordState.NO_PASSWORD,
                    Type: MeetingType.PERSONAL,
                    ProtonCalendar: ProtonCalendarState.NOT_FROM_PROTON_CALENDAR,
                    ...(isWaitingRoomCreationEnabled ? { WaitingRoom: WaitingRoomState.DISABLED } : {}),
                })
            );

            return {
                meetingLink: getMeetingLink(response.Meeting.MeetingLinkName, passwordBase),
                id: response.Meeting.MeetingLinkName,
                meeting: response.Meeting,
            };
        } catch (error) {
            reportMeetError('Error rotating personal meeting link handshake', error);
            const { message } = getApiError(error);
            throw new Error(message ?? c('Error').t`Failed to rotate personal meeting link`);
        }
    };

    return { rotatePersonalMeeting };
};
