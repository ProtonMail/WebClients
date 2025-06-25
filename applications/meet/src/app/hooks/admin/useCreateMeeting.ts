import { c } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { useApi } from '@proton/components';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';

import { type CreateMeetingResponse, CustomPasswordState, RecurringType } from '../../response-types';
import { prepareMeetingCryptoData } from '../../utils/cryptoUtils';

export const createMeetingCall = () => {
    return {
        method: 'post',
        url: 'meet/v1/meetings',
        silence: true,
    };
};

export const useCreateMeeting = () => {
    const api = useApi();

    const getAddresses = useGetAddresses();

    const getUserKeys = useGetUserKeys();

    const createMeeting = async ({
        meetingName,
        startTime,
        endTime,
        recurring,
        timeZone,
        customPassword = '',
    }: {
        meetingName: string;
        startTime: string;
        endTime: string;
        recurring: boolean;
        timeZone?: string;
        customPassword?: string;
    }) => {
        const addresses = await getAddresses();

        const activeAddresses = getActiveAddresses(addresses || []);

        const userKeys = await getUserKeys();
        const privateKey = userKeys[0].privateKey;

        const addressId = activeAddresses[0].ID;

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
            customPassword,
            primaryUserKey: privateKey,
            meetingName,
            api,
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
                    RRule: recurring ? RecurringType.RECURRING : RecurringType.SCHEDULED,
                    TimeZone: timeZone,
                    CustomPassword: !!customPassword
                        ? CustomPasswordState.PASSWORD_SET
                        : CustomPasswordState.NO_PASSWORD,
                },
            });

            return {
                meetingLink: `/join/${response.Meeting.MeetingLinkName}#${passwordBase}`,
                id: response.Meeting.MeetingLinkName,
            };
        } catch (error) {
            throw new Error(c('l10n_nightly Error').t`Failed to create meeting`);
        }
    };

    return { createMeeting };
};
