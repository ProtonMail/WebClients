import type { PrivateKeyReference } from '@protontech/crypto';

import { useApi } from '@proton/components';
import { createMeetingCall } from '@proton/shared/lib/api/meet';
import {
    CustomPasswordState,
    MeetingType,
    ProtonCalendarState,
    WaitingRoomState,
} from '@proton/shared/lib/interfaces/Meet';
import type { CreateMeetingResponse } from '@proton/shared/lib/interfaces/Meet';
import { useFlag } from '@proton/unleash/useFlag';

import type { CreateMeetingParams } from '../types/types';
import { prepareMeetingCryptoData } from '../utils/cryptoUtils';
import { useMeetErrorReporting } from './useMeetErrorReporting';

export interface SaveMeetingParams {
    params: CreateMeetingParams;
    privateKey?: PrivateKeyReference;
    addressId: string | null;
    noPasswordSave?: boolean;
}

export const useSaveMeeting = () => {
    const isMeetWaitingRoomEnabled = useFlag('MeetWaitingRoom');

    const api = useApi();

    const { reportMeetError } = useMeetErrorReporting();

    const saveMeeting = async ({
        params: { protonCalendar, meetingName, startTime, endTime, recurrence, timeZone, type, waitingRoom },
        privateKey,
        addressId,
        noPasswordSave = false,
    }: SaveMeetingParams) => {
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
            noEncryptedPasswordReturn: noPasswordSave,
        });

        try {
            const response = await api<CreateMeetingResponse>({
                ...createMeetingCall({
                    Name: encryptedMeetingName,
                    Password: encryptedPassword,
                    Salt: salt,
                    SessionKey: encryptedSessionKey,
                    SRPModulusID: srpModulusID,
                    SRPSalt: urlPasswordSalt,
                    SRPVerifier: srpVerifier,
                    AddressID: addressId,
                    StartTime: startTime ?? null,
                    EndTime: endTime ?? null,
                    RRule: recurrence ?? null,
                    Timezone: timeZone ?? null,
                    CustomPassword: CustomPasswordState.NO_PASSWORD,
                    Type: type ?? MeetingType.INSTANT,
                    ProtonCalendar: !!protonCalendar
                        ? ProtonCalendarState.FROM_PROTON_CALENDAR
                        : ProtonCalendarState.NOT_FROM_PROTON_CALENDAR,
                    ...(isMeetWaitingRoomEnabled ? { WaitingRoom: waitingRoom ?? WaitingRoomState.DISABLED } : {}),
                }),
            });

            return {
                response,
                passwordBase,
            };
        } catch (error) {
            reportMeetError('Error saving meeting', error);

            throw error;
        }
    };

    return saveMeeting;
};
