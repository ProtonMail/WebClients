import { useCallback } from 'react';

import { useApi } from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto';

import type { CreateMeetingParams, CreateMeetingResponse } from '../types/response-types';
import { CustomPasswordState } from '../types/response-types';
import { prepareMeetingCryptoData } from '../utils/cryptoUtils';
import { useMeetErrorReporting } from './useMeetErrorReporting';

export const createMeetingCall = () => {
    return {
        method: 'post',
        url: 'meet/v1/meetings',
        silence: true,
    };
};

export const useSaveMeeting = () => {
    const api = useApi();

    const reportMeetError = useMeetErrorReporting();

    const saveMeeting = useCallback(
        async ({
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
                    ...createMeetingCall(),
                    data: {
                        Name: encryptedMeetingName,
                        Password: encryptedPassword,
                        Salt: salt,
                        SessionKey: encryptedSessionKey,
                        SRPModulusID: srpModulusID,
                        SRPSalt: urlPasswordSalt,
                        SRPVerifier: srpVerifier,
                        AddressID: addressId,
                        StartTime: startTime,
                        EndTime: endTime,
                        RRule: recurrence,
                        Timezone: timeZone,
                        CustomPassword: !!customPassword
                            ? CustomPasswordState.PASSWORD_SET
                            : CustomPasswordState.NO_PASSWORD,
                        Type: type,
                    },
                });

                return {
                    response,
                    passwordBase,
                };
            } catch (error) {
                reportMeetError('Error saving meeting', error);

                throw error;
            }
        },
        [api]
    );

    return saveMeeting;
};
