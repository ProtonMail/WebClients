import { useCallback, useRef } from 'react';

import type { SessionKey } from '@protontech/crypto';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { meetingInfoThunk } from '@proton/meet/store/slices/meetingInfoModel';
import { decryptSessionKey } from '@proton/meet/utils/cryptoUtils';

export type GetSessionKey = (meetingLinkName: string, password?: string) => Promise<SessionKey | null>;
export type GetSessionKeyBase64 = (meetingLinkName: string, password?: string) => Promise<string | null>;

export const useSessionKey = ({ urlPassword }: { urlPassword: string }) => {
    const dispatch = useMeetDispatch();

    const meetingSessionKeyBase64Ref = useRef<string | null>(null);
    const sessionKeyRef = useRef<SessionKey | null>(null);

    const getSessionKey = useCallback<GetSessionKey>(
        async (meetingLinkName, password) => {
            if (sessionKeyRef.current) {
                return sessionKeyRef.current;
            }

            const meetingPassword = password ?? urlPassword;

            const { meetingInfo } = await dispatch(meetingInfoThunk({ meetingLinkName, meetingPassword }));

            const sessionKey = await decryptSessionKey({
                encryptedSessionKey: meetingInfo.SessionKey,
                password: meetingPassword,
                salt: meetingInfo.Salt,
            });
            sessionKeyRef.current = sessionKey ?? null;
            return sessionKeyRef.current;
        },
        [dispatch, urlPassword]
    );

    const getSessionKeyBase64 = useCallback<GetSessionKeyBase64>(
        async (meetingLinkName, password) => {
            if (meetingSessionKeyBase64Ref.current) {
                return meetingSessionKeyBase64Ref.current;
            }

            const sessionKey = await getSessionKey(meetingLinkName, password);
            meetingSessionKeyBase64Ref.current = sessionKey ? sessionKey.data.toBase64() : null;
            return meetingSessionKeyBase64Ref.current;
        },
        [getSessionKey]
    );

    return {
        getSessionKeyBase64,
        getSessionKey,
    };
};
