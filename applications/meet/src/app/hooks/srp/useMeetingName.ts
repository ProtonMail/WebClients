import type { SessionKey } from 'packages/crypto/lib/worker/api.models';

import { CryptoProxy } from '@proton/crypto/lib/proxy';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { computeKeyPassword } from '@proton/srp/lib/keys';

import { useMeetSrp } from './useMeetSrp';

export const useMeetingName = (token: string, urlPassword: string) => {
    const { initHandshake, getSessionToken, getMeetingInfo } = useMeetSrp();

    const getMeetingName = async () => {
        await initHandshake(token)
            .then(async ({ handshakeInfo }) => {
                return getSessionToken(token, urlPassword, handshakeInfo)
                    .then(async () => {
                        const meetingInfo = await getMeetingInfo(token);

                        const decryptShareSessionKey = async (keyPacket: string | Uint8Array, password: string) => {
                            const messageType = keyPacket instanceof Uint8Array ? 'binaryMessage' : 'armoredMessage';
                            return CryptoProxy.decryptSessionKey({ [messageType]: keyPacket, passwords: [password] });
                        };

                        const sessionKeyPassphrase = await computeKeyPassword(
                            urlPassword,
                            meetingInfo.MeetingInfo.Salt
                        );

                        const decryptedSessionKey = (await decryptShareSessionKey(
                            base64StringToUint8Array(meetingInfo.MeetingInfo.SessionKey),
                            sessionKeyPassphrase
                        )) as SessionKey;

                        const decryptedMeetingName = await CryptoProxy.decryptMessage({
                            binaryMessage: base64StringToUint8Array(meetingInfo.MeetingInfo.MeetingName),
                            sessionKeys: [decryptedSessionKey],
                            format: 'utf8',
                        });

                        return decryptedMeetingName.data;
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            })
            .catch((error) => {
                console.log(error);
            });
    };

    return getMeetingName;
};
