import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import { utf8StringToUint8Array } from '@proton/crypto/lib/utils';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

export const encryptTemporaryPassword = async (password: string, publicKey: PublicKeyReference) => {
    const { message } = await CryptoProxy.encryptMessage({
        binaryData: utf8StringToUint8Array(password),
        format: 'binary',
        encryptionKeys: [publicKey],
    });
    return message.toBase64();
};

export const decryptTemporaryPassword = async (encryptedPassword: string, privateKey: PrivateKeyReference) => {
    const { data: password } = await CryptoProxy.decryptMessage({
        decryptionKeys: [privateKey],
        binaryMessage: Uint8Array.fromBase64(encryptedPassword),
        format: 'utf8',
    });
    return password;
};

export const getJoiningLinkHref = (config: {
    token: string;
    password: string;
    organizationName: string | undefined;
    domainName: string | undefined;
}) => {
    const accountPath = getAppHref(SSO_PATHS.JOIN_ORG, APPS.PROTONACCOUNT);

    const hashParams = {
        t: config.token,
        p: config.password,
        o: config.organizationName,
        d: config.domainName,
    };

    const filtered = Object.entries(hashParams).filter(([, value]) => typeof value === 'string') as unknown as [
        string,
        string,
    ][];

    const params = new URLSearchParams(filtered).toString();
    const hashPart = stringToUint8Array(params).toBase64({ alphabet: 'base64url', omitPadding: true });
    return `${accountPath}#${hashPart}`;
};

export const parseJoiningLinkConfig = ({ hash }: { hash: string }) => {
    const encodedHash = hash.slice(1);
    let decodedHash = '';
    try {
        decodedHash = uint8ArrayToString(Uint8Array.fromBase64(encodedHash, { alphabet: 'base64url' }));
    } catch {}
    const hashParams = new URLSearchParams(decodedHash);
    const config = {
        password: hashParams.get('p') ?? '',
        token: hashParams.get('t') ?? '',
        domain: hashParams.get('d') ?? '',
        orgName: hashParams.get('o') ?? '',
        username: hashParams.get('u') ?? '',
    };

    if (!config.password || !config.token) {
        return undefined;
    }

    return config;
};
