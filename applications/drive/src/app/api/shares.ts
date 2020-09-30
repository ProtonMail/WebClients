export const queryCreateSharedLink = (
    shareId: string,
    data: {
        ExpirationTime: number;
        MaxAccesses: number;
        CreatorEmail: string;
        Permissions: number; // Only read (4) in first iteration
        UrlPasswordSalt: string;
        SharePasswordSalt: string;
        SRPVerifier: string;
        SRPModulusID: string;
        SharePassphraseKeyPacket: string;
        Password: string;
        Flags: number; // Unused in first iteration
    }
) => {
    return {
        method: 'post',
        url: `drive/shares/${shareId}/urls`,
        data,
    };
};

export const querySharedURLs = (shareId: string) => {
    return {
        method: 'get',
        url: `drive/shares/${shareId}/urls`,
    };
};
