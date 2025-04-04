export interface QRCodePayload {
    version: number;
    userCode: string;
    encodedBytes: string;
    childClientId: string;
}

const currentVersion = 0;

export const deserializeQrCodePayload = (data: string): QRCodePayload => {
    const [versionString, userCode, encodedBytes, childClientId] = data.split(':');
    const version = parseInt(versionString, 10);
    if (version !== currentVersion || !userCode || !encodedBytes || !childClientId) {
        throw new Error('Invalid code');
    }
    return {
        version,
        userCode,
        encodedBytes,
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
