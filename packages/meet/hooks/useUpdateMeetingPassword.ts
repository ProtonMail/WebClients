import { useCallback } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/components';
import { srpGetVerify } from '@proton/shared/lib/srp';

import type { CreateMeetingResponse, CustomPasswordState } from '../types/response-types';
import { encryptMeetingPassword, encryptSessionKey, hashPasswordWithSalt } from '../utils/cryptoUtils';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useMeetErrorReporting } from './useMeetErrorReporting';

const updateMeetingPasswordCall = (meetingId: string) => {
    return {
        method: 'put',
        url: `meet/v1/meetings/${meetingId}/password`,
        silence: true,
    };
};

export const useUpdateMeetingPassword = () => {
    const api = useApi();

    const getMeetingDependencies = useGetMeetingDependencies();

    const reportMeetError = useMeetErrorReporting();

    const updateMeetingPassword = useCallback(
        async ({
            meetingId,
            password,
            sessionKey,
            customPassword,
            salt,
        }: {
            meetingId: string;
            password: string;
            sessionKey: Uint8Array<ArrayBuffer>;
            customPassword: CustomPasswordState;
            salt?: string;
        }) => {
            try {
                const { privateKey } = await getMeetingDependencies();

                const encryptedPassword = await encryptMeetingPassword(password, privateKey);

                const { passwordHash } = await hashPasswordWithSalt(password, salt);

                const encryptedSessionKey = await encryptSessionKey(sessionKey, passwordHash);

                const {
                    Auth: { Salt: srpSalt, Verifier: srpVerifier, ModulusID: srpModulusID },
                } = await srpGetVerify({ api, credentials: { password: password } });

                const { Meeting } = await api<CreateMeetingResponse>({
                    ...updateMeetingPasswordCall(meetingId),
                    data: {
                        Password: encryptedPassword,
                        SessionKey: encryptedSessionKey,
                        SRPSalt: srpSalt,
                        SRPVerifier: srpVerifier,
                        SRPModulusID: srpModulusID,
                        CustomPassword: customPassword,
                    },
                });

                return Meeting;
            } catch (error) {
                reportMeetError('Error updating meeting password', error);

                throw new Error(c('meet_2025 Info').t`Failed to update meeting password`);
            }
        },
        [api]
    );

    return { updateMeetingPassword };
};
