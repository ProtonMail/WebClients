import { useCallback, useRef } from 'react';

import type { SessionKey } from '@protontech/crypto';

import { decryptSessionKey } from '@proton/meet/utils/cryptoUtils';

import type { useMeetingSetup } from '../srp/useMeetingSetup';

type MeetingSetup = ReturnType<typeof useMeetingSetup>;

export type GetSessionKey = (meetingLinkName: string, password?: string) => Promise<SessionKey | null>;
export type GetSessionKeyBase64 = (meetingLinkName: string, password?: string) => Promise<string | null>;

export const useSessionKey = ({
    getCachedMeetingInfo,
    urlPassword,
}: {
    getCachedMeetingInfo: MeetingSetup['getMeetingInfo'];
    urlPassword: string;
}) => {
    const meetingSessionKeyBase64Ref = useRef<string | null>(null);
    const sessionKeyRef = useRef<SessionKey | null>(null);

    const getSessionKey = useCallback<GetSessionKey>(
        async (meetingLinkName, password) => {
            if (sessionKeyRef.current) {
                return sessionKeyRef.current;
            }

            const meetingInfo = await getCachedMeetingInfo(meetingLinkName);
            const sessionKey = await decryptSessionKey({
                encryptedSessionKey: meetingInfo.MeetingInfo.SessionKey,
                password: password ?? urlPassword,
                salt: meetingInfo.MeetingInfo.Salt,
            });
            sessionKeyRef.current = sessionKey ?? null;
            return sessionKeyRef.current;
        },
        [getCachedMeetingInfo, urlPassword]
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
