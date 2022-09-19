import { CryptoProxy, PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { arrayToBinaryString, decodeBase64, encodeBase64 } from '@proton/crypto/lib/utils';

import { AES256, EVENT_ACTIONS } from '../../constants';
import { generateRandomBytes, getSHA256Base64String, xorEncryptDecrypt } from '../../helpers/crypto';
import { stringToUint8Array, uint8ArrayToPaddedBase64URLString, uint8ArrayToString } from '../../helpers/encoding';
import { Nullable } from '../../interfaces';
import { ACCESS_LEVEL, CalendarLink, CalendarUrl } from '../../interfaces/calendar';
import {
    CalendarUrlEventManager,
    CalendarUrlEventManagerCreate,
    CalendarUrlEventManagerDelete,
    CalendarUrlEventManagerUpdate,
} from '../../interfaces/calendar/EventManager';

export const getIsCalendarUrlEventManagerDelete = (
    event: CalendarUrlEventManager
): event is CalendarUrlEventManagerDelete => {
    return event.Action === EVENT_ACTIONS.DELETE;
};
export const getIsCalendarUrlEventManagerCreate = (
    event: CalendarUrlEventManager
): event is CalendarUrlEventManagerCreate => {
    return event.Action === EVENT_ACTIONS.CREATE;
};
export const getIsCalendarUrlEventManagerUpdate = (
    event: CalendarUrlEventManager
): event is CalendarUrlEventManagerUpdate => {
    return event.Action === EVENT_ACTIONS.UPDATE;
};

export const decryptPurpose = async ({
    encryptedPurpose,
    privateKeys,
}: {
    encryptedPurpose: string;
    privateKeys: PrivateKeyReference[];
}) =>
    (
        await CryptoProxy.decryptMessage({
            armoredMessage: encryptedPurpose,
            decryptionKeys: privateKeys,
        })
    ).data;
export const generateEncryptedPurpose = async ({
    purpose,
    publicKeys,
}: {
    purpose?: string;
    publicKeys: PublicKeyReference[];
}) => {
    if (!purpose) {
        return null;
    }

    return (
        await CryptoProxy.encryptMessage({ textData: purpose, stripTrailingSpaces: true, encryptionKeys: publicKeys })
    ).message;
};
export const generateEncryptedPassphrase = ({
    passphraseKey,
    passphrase,
}: {
    passphraseKey: Uint8Array;
    passphrase: string;
}) => encodeBase64(xorEncryptDecrypt({ key: uint8ArrayToString(passphraseKey), data: decodeBase64(passphrase) }));

export const generateCacheKey = () => uint8ArrayToPaddedBase64URLString(generateRandomBytes(16));

export const generateCacheKeySalt = () => encodeBase64(arrayToBinaryString(generateRandomBytes(8)));

export const getCacheKeyHash = ({ cacheKey, cacheKeySalt }: { cacheKey: string; cacheKeySalt: string }) =>
    getSHA256Base64String(`${cacheKeySalt}${cacheKey}`);

export const generateEncryptedCacheKey = async ({
    cacheKey,
    publicKeys,
}: {
    cacheKey: string;
    publicKeys: PublicKeyReference[];
}) =>
    (
        await CryptoProxy.encryptMessage({
            textData: cacheKey, // stripTrailingSpaces: false
            encryptionKeys: publicKeys,
        })
    ).message;

export const decryptCacheKey = async ({
    encryptedCacheKey,
    privateKeys,
}: {
    encryptedCacheKey: string;
    privateKeys: PrivateKeyReference[];
}) =>
    (
        await CryptoProxy.decryptMessage({
            armoredMessage: encryptedCacheKey,
            decryptionKeys: privateKeys,
        })
    ).data;

export const getPassphraseKey = ({
    encryptedPassphrase,
    calendarPassphrase,
}: {
    encryptedPassphrase: Nullable<string>;
    calendarPassphrase: string;
}) => {
    if (!encryptedPassphrase) {
        return null;
    }

    return stringToUint8Array(
        xorEncryptDecrypt({ key: decodeBase64(calendarPassphrase), data: decodeBase64(encryptedPassphrase) })
    );
};

export const buildLink = ({
    urlID,
    accessLevel,
    passphraseKey,
    cacheKey,
}: {
    urlID: string;
    accessLevel: ACCESS_LEVEL;
    passphraseKey: Nullable<Uint8Array>;
    cacheKey: string;
}) => {
    // calendar.proton.me must be hardcoded here as using getAppHref would produce links that wouldn't work
    const baseURL = `https://calendar.proton.me/api/calendar/v1/url/${urlID}/calendar.ics`;
    const encodedCacheKey = encodeURIComponent(cacheKey);

    if (accessLevel === ACCESS_LEVEL.FULL && passphraseKey) {
        const encodedPassphraseKey = encodeURIComponent(uint8ArrayToPaddedBase64URLString(passphraseKey));

        return `${baseURL}?CacheKey=${encodedCacheKey}&PassphraseKey=${encodedPassphraseKey}`;
    }

    return `${baseURL}?CacheKey=${encodedCacheKey}`;
};

export const getCreatePublicLinkPayload = async ({
    accessLevel,
    publicKeys,
    passphrase,
    passphraseID,
    encryptedPurpose = null,
}: {
    accessLevel: ACCESS_LEVEL;
    publicKeys: PublicKeyReference[];
    passphrase: string;
    passphraseID: string;
    encryptedPurpose?: Nullable<string>;
}) => {
    const passphraseKey = await CryptoProxy.generateSessionKeyForAlgorithm(AES256);
    const encryptedPassphrase =
        accessLevel === ACCESS_LEVEL.FULL ? generateEncryptedPassphrase({ passphraseKey, passphrase }) : null;

    const cacheKeySalt = generateCacheKeySalt();
    const cacheKey = generateCacheKey();
    const cacheKeyHash = await getCacheKeyHash({ cacheKey, cacheKeySalt });
    const encryptedCacheKey = await generateEncryptedCacheKey({ cacheKey, publicKeys });

    return {
        payload: {
            AccessLevel: accessLevel,
            CacheKeySalt: cacheKeySalt,
            CacheKeyHash: cacheKeyHash,
            EncryptedPassphrase: encryptedPassphrase,
            EncryptedPurpose: encryptedPurpose,
            EncryptedCacheKey: encryptedCacheKey,
            PassphraseID: accessLevel === ACCESS_LEVEL.FULL ? passphraseID : null,
        },
        passphraseKey,
        cacheKey,
    };
};

export const transformLinkFromAPI = async ({
    calendarUrl,
    privateKeys,
    calendarPassphrase,
    onError,
}: {
    calendarUrl: CalendarUrl;
    privateKeys: PrivateKeyReference[];
    calendarPassphrase: string;
    onError: (e: Error) => void;
}): Promise<CalendarLink> => {
    const {
        EncryptedPurpose: encryptedPurpose,
        CalendarUrlID,
        AccessLevel,
        EncryptedCacheKey,
        EncryptedPassphrase,
    } = calendarUrl;
    let purpose = null;
    let link = '';

    if (encryptedPurpose) {
        try {
            purpose = await decryptPurpose({
                encryptedPurpose,
                privateKeys,
            });
        } catch (e: any) {
            onError(e);
            purpose = encryptedPurpose;
        }
    }

    try {
        const cacheKey = await decryptCacheKey({ encryptedCacheKey: EncryptedCacheKey, privateKeys });
        const passphraseKey = getPassphraseKey({ encryptedPassphrase: EncryptedPassphrase, calendarPassphrase });

        link = buildLink({
            urlID: CalendarUrlID,
            accessLevel: AccessLevel,
            passphraseKey,
            cacheKey,
        });
    } catch (e: any) {
        onError(e);
        link = `Error building link: ${e.message}`;
    }

    return {
        ...calendarUrl,
        purpose,
        link,
    };
};

export const transformLinksFromAPI = async ({
    calendarUrls,
    privateKeys,
    calendarPassphrase,
    onError,
}: {
    calendarUrls: CalendarUrl[];
    privateKeys: PrivateKeyReference[];
    calendarPassphrase: string;
    onError: (e: Error) => void;
}) => {
    return Promise.all(
        calendarUrls.map((calendarUrl) =>
            transformLinkFromAPI({
                calendarUrl,
                privateKeys,
                calendarPassphrase,
                onError,
            })
        )
    );
};
