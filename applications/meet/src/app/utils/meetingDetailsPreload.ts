import { decryptMeetingName } from '@proton/meet/utils/cryptoUtils';
import type { Api } from '@proton/shared/lib/interfaces';

import { requestHandshakeInfo, requestMeetingInfo, requestSessionToken } from '../hooks/srp/meetSrpRequests';
import { getPublicToken, getUrlPassword } from '../hooks/srp/usePublicToken';

export interface PreloadedMeetingDetails {
    roomName: string;
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    expirationTime: number;
    isPersonalRoom: boolean;
}

const preloadCache = new Map<string, Promise<PreloadedMeetingDetails>>();

const fetchMeetingDetails = async ({
    api,
    token,
    password,
    uid,
    cryptoReady,
}: {
    api: Api;
    token: string;
    password: string;
    uid?: string;
    cryptoReady: Promise<unknown>;
}): Promise<PreloadedMeetingDetails> => {
    const [handshakeInfo] = await Promise.all([requestHandshakeInfo(api, token), cryptoReady]);

    await requestSessionToken(api, { token, password, handshakeInfo, uid });
    const meetingInfo = await requestMeetingInfo(api, token);

    const roomName = await decryptMeetingName({
        password,
        encryptedSessionKey: meetingInfo.MeetingInfo.SessionKey,
        encryptedMeetingName: meetingInfo.MeetingInfo.MeetingName,
        salt: meetingInfo.MeetingInfo.Salt,
    });

    return {
        roomName,
        locked: !!meetingInfo.MeetingInfo.Locked,
        maxDuration: meetingInfo.MeetingInfo.MaxDuration,
        maxParticipants: meetingInfo.MeetingInfo.MaxParticipants,
        expirationTime: meetingInfo.MeetingInfo.ExpirationTime ?? 0,
        isPersonalRoom: !!meetingInfo.MeetingInfo.PersonalMeeting,
    };
};

/**
 * Kicks off the meeting details request for the meeting link in the current URL.
 *
 * Called from the bootstrap so the requests overlap the remaining startup work (crypto and
 * meet-core WASM init) instead of waiting for the prejoin to mount.
 */
export const startMeetingDetailsPreload = ({
    api,
    uid,
    cryptoReady,
}: {
    api: Api;
    uid?: string;
    cryptoReady: Promise<unknown>;
}) => {
    let token = '';
    let password = '';

    try {
        token = getPublicToken();
        password = getUrlPassword();
    } catch {
        // Not a valid meeting link, nothing to preload.
        return;
    }

    if (!token || !password || preloadCache.has(token)) {
        return;
    }

    const promise = fetchMeetingDetails({ api, token, password, uid, cryptoReady }).catch((error) => {
        preloadCache.delete(token);
        throw error;
    });

    preloadCache.set(token, promise);

    // Nothing awaits the promise until the prejoin mounts.
    promise.catch(() => {});
};

export const getPreloadedMeetingDetails = (token: string) => preloadCache.get(token);

export const hasPreloadedMeetingDetails = async (token: string) => {
    const preloaded = preloadCache.get(token);

    if (!preloaded) {
        return false;
    }

    try {
        await preloaded;
        return true;
    } catch {
        return false;
    }
};
