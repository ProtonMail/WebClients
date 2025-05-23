import { signData } from '@proton/crypto/lib/subtle/hmac';

const base64url = (input: Uint8Array) => {
    return btoa(String.fromCharCode(...input))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const header = { alg: 'HS256', typ: 'JWT' };

export const createToken = async ({
    identity,
    room,
    displayName,
}: {
    identity: string;
    room: string;
    displayName: string;
}) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    const now = Math.floor(Date.now() / 1000);

    const payload = {
        iss: apiKey,
        sub: identity,
        name: displayName,
        nbf: now,
        exp: now + 4 * 60 * 60,
        video: {
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
            room,
            canPublishSources: ['camera', 'microphone', 'screen_share', 'encrypted'],
            canPublishEncrypted: true,
        },
        metadata: JSON.stringify({ displayName }),
    };

    const encodedHeader = base64url(new TextEncoder().encode(JSON.stringify(header)));
    const encodedPayload = base64url(new TextEncoder().encode(JSON.stringify(payload)));

    const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(apiSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await signData(key, data);

    return `${encodedHeader}.${encodedPayload}.${base64url(signature)}`;
};
