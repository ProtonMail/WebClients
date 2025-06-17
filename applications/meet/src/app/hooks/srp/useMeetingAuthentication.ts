import { useCallback } from 'react';

import type { SessionKey } from 'packages/crypto/lib/worker/api.models';

import { CryptoProxy } from '@proton/crypto/lib/proxy';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { computeKeyPassword } from '@proton/srp/lib/keys';

import { useMeetSrp } from './useMeetSrp';

const decryptShareSessionKey = async (keyPacket: string | Uint8Array, password: string) => {
    const messageType = keyPacket instanceof Uint8Array ? 'binaryMessage' : 'armoredMessage';
    return CryptoProxy.decryptSessionKey({ [messageType]: keyPacket, passwords: [password] });
};

export const useMeetingAuthentication = (token: string, urlPassword: string) => {
    const { initHandshake, getSessionToken, getMeetingInfo, getAccessToken } = useMeetSrp();

    const getRoomName = useCallback(async (): Promise<string> => {
        let meetingName = '';

        try {
            const { handshakeInfo } = await initHandshake(token);

            await getSessionToken(token, urlPassword, handshakeInfo);

            const meetingInfo = await getMeetingInfo(token);

            const sessionKeyPassphrase = await computeKeyPassword(urlPassword, meetingInfo.MeetingInfo.Salt);

            const decryptedSessionKey = (await decryptShareSessionKey(
                base64StringToUint8Array(meetingInfo.MeetingInfo.SessionKey),
                sessionKeyPassphrase
            )) as SessionKey;

            const decryptedMeetingName = (await CryptoProxy.decryptMessage({
                binaryMessage: base64StringToUint8Array(meetingInfo.MeetingInfo.MeetingName),
                sessionKeys: [decryptedSessionKey],
                format: 'utf8',
            })) as { data: string };

            meetingName = decryptedMeetingName.data as string;
        } catch (error) {
            console.log(error);
        }

        return meetingName;
    }, [token, urlPassword]);

    const getAcccessDetails = useCallback(
        async (displayName: string) => {
            const data = await getAccessToken(token, displayName);
            return {
                accessToken: data.AccessToken,
                websocketUrl: data.WebsocketUrl.replace('/rtc', ''),
            };
        },
        [token]
    );

    return { getRoomName, getAcccessDetails };
};
