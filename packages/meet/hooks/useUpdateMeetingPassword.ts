import { useCallback } from 'react';

import { c } from 'ttag';

import { useApi } from '@proton/components';
import { srpGetVerify } from '@proton/shared/lib/srp';

import type { CreateMeetingResponse } from '../types/response-types';
import { encryptMeetingPassword, encryptSessionKey, hashPasswordWithSalt } from '../utils/cryptoUtils';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';

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

    const updateMeetingPassword = useCallback(
        async (meetingId: string, password: string, sessionKey: Uint8Array) => {
            try {
                const { privateKey } = await getMeetingDependencies();

                const encryptedPassword = await encryptMeetingPassword(password, privateKey);

                const { passwordHash, salt } = await hashPasswordWithSalt(password);

                const encryptedSessionKey = await encryptSessionKey(sessionKey, passwordHash);

                const {
                    Auth: { Salt: srpSalt, Verifier: srpVerifier, ModulusID: srpModulusID },
                } = await srpGetVerify({ api, credentials: { password: password } });

                const { Meeting } = await api<CreateMeetingResponse>({
                    ...updateMeetingPasswordCall(meetingId),
                    data: {
                        Password: encryptedPassword,
                        SessionKey: encryptedSessionKey,
                        Salt: salt,
                        SRPSalt: srpSalt,
                        SRPVerifier: srpVerifier,
                        SRPModulusID: srpModulusID,
                    },
                });

                return Meeting;
            } catch (error) {
                console.error(error);

                throw new Error(c('l10n_nightly Info').t`Failed to update meeting password`);
            }
        },
        [api]
    );

    return { updateMeetingPassword };
};
