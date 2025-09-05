import { useApi } from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto';
import { createMeetingCall } from '@proton/shared/lib/api/meet';
import { CustomPasswordState, MeetingType } from '@proton/shared/lib/interfaces/Meet';
import type { CreateMeetingResponse, RecurringType } from '@proton/shared/lib/interfaces/Meet';

import type { CreateMeetingParams } from '../types/types';
import { prepareMeetingCryptoData } from '../utils/cryptoUtils';
import { useMeetErrorReporting } from './useMeetErrorReporting';

export const useSaveMeeting = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const saveMeeting = async ({
        params: { customPassword, meetingName, startTime, endTime, recurrence, timeZone, type },
        privateKey,
        addressId,
        noPasswordSave = false,
    }: {
        params: CreateMeetingParams;
        privateKey?: PrivateKeyReference;
        addressId: string | null;
        noPasswordSave?: boolean;
    }) => {
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
            customPassword: customPassword || '',
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
                    RRule: (recurrence as RecurringType) ?? null,
                    Timezone: timeZone ?? null,
                    CustomPassword: !!customPassword
                        ? CustomPasswordState.PASSWORD_SET
                        : CustomPasswordState.NO_PASSWORD,
                    Type: type ?? MeetingType.INSTANT,
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
