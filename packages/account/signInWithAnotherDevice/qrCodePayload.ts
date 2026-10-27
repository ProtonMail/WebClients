export interface QRCodePayload {
    version: number;
    userCode: string;
    // Encoded bytes may be empty when password isn't expected
    encodedBytes: string | undefined;
    childClientId: string;
}

const currentVersion = 0;

// Fork user codes from the API are 5 random bytes in Crockford base32: 8 chars, uppercase, no I/L/O/U.
// The payload can come from an untrusted link, so reject anything else.
const userCodeRegex = /^[0-9A-HJKMNP-TV-Z]{8}$/;

export const deserializeQrCodePayload = (data: string): QRCodePayload => {
    const [versionString, userCode, encodedBytes, childClientId] = data.split(':');
    const version = parseInt(versionString, 10);
    if (version !== currentVersion || !userCodeRegex.test(userCode ?? '') || !childClientId) {
        throw new Error('Invalid code');
    }
    return {
        version,
        userCode,
        encodedBytes: !encodedBytes ? undefined : encodedBytes,
        childClientId,
    };
};

export const serializeQrCodePayload = (data: QRCodePayload): string => {
    return [currentVersion, data.userCode, data.encodedBytes, data.childClientId].join(':');
};

export const getQrCodePayload = ({
    userCode,
    encodedBytes,
    childClientId,
}: {
    userCode: string;
    encodedBytes: string;
    childClientId: string;
}): QRCodePayload => {
    return {
        version: currentVersion,
        userCode,
        encodedBytes,
        childClientId,
    };
};
