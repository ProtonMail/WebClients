import { c } from 'ttag';

import { useApi } from '@proton/components';
import type { SessionKey } from '@proton/crypto';
import { updateMeetingPasswordCall } from '@proton/shared/lib/api/meet';
import type { CreateMeetingResponse, CustomPasswordState } from '@proton/shared/lib/interfaces/Meet';
import { srpGetVerify } from '@proton/shared/lib/srp';

import { encryptMeetingPassword, encryptSessionKey, hashPasswordWithSalt } from '../utils/cryptoUtils';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useMeetErrorReporting } from './useMeetErrorReporting';

export const useUpdateMeetingPassword = () => {
    const api = useApi();

    const getMeetingDependencies = useGetMeetingDependencies();

    const reportMeetError = useMeetErrorReporting();

    const updateMeetingPassword = async ({
        meetingId,
        password,
        sessionKey,
        customPassword,
        salt,
    }: {
        meetingId: string;
        password: string;
        sessionKey: SessionKey;
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
                ...updateMeetingPasswordCall(meetingId, {
                    Password: encryptedPassword,
                    SessionKey: encryptedSessionKey,
                    SRPSalt: srpSalt,
                    SRPVerifier: srpVerifier,
                    SRPModulusID: srpModulusID,
                    CustomPassword: customPassword,
                }),
            });

            return Meeting;
        } catch (error) {
            reportMeetError('Error updating meeting password', error);

            throw new Error(c('Info').t`Failed to update meeting password`);
        }
    };

    return { updateMeetingPassword };
};
