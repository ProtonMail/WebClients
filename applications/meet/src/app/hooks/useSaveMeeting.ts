import { useCallback } from 'react';

import { useApi } from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto';

import { type CreateMeetingResponse, CustomPasswordState, RecurringType } from '../response-types';
import type { CreateMeetingParams } from '../types';
import { prepareMeetingCryptoData } from '../utils/cryptoUtils';

export const createMeetingCall = () => {
    return {
        method: 'post',
        url: 'meet/v1/meetings',
        silence: true,
    };
};

const getRecurringType = (recurring: boolean) => {
    return recurring ? RecurringType.RECURRING : RecurringType.SCHEDULED;
};

export const useSaveMeeting = () => {
    const api = useApi();

    const saveMeeting = useCallback(
        async ({
            params: { customPassword, meetingName, startTime, endTime, recurring, timeZone, type },
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

            const recurringRule = recurring === null ? null : getRecurringType(recurring);

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
                    RRule: recurringRule,
                    TimeZone: timeZone,
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
        },
        [api]
    );

    return saveMeeting;
};
