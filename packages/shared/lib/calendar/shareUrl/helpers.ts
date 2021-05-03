import {
    arrayToBinaryString,
    createMessage,
    decodeBase64,
    decryptMessage,
    encryptMessage,
    generateSessionKey,
    getMessage,
    OpenPGPKey,
} from 'pmcrypto';
import { AES256, EVENT_ACTIONS } from '../../constants';
import { encodeBase64 } from '../../helpers/base64';
import { generateRandomBytes, getSHA256Base64String, xorEncryptDecrypt } from '../../helpers/crypto';
import { stringToUint8Array, uint8ArrayToPaddedBase64URLString, uint8ArrayToString } from '../../helpers/encoding';
import { Nullable } from '../../interfaces';
import { ACCESS_LEVEL, Calendar, CalendarLink, CalendarUrl } from '../../interfaces/calendar';
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
    privateKeys: OpenPGPKey[];
}) =>
    (
        await decryptMessage({
            message: await getMessage(encryptedPurpose),
            privateKeys,
        })
    ).data;
export const generateEncryptedPurpose = async ({
    purpose,
    publicKeys,
}: {
    purpose?: string;
    publicKeys: OpenPGPKey[];
}) => {
    if (!purpose) {
        return null;
    }

    return (await encryptMessage({ data: purpose, publicKeys })).data;
};
export const generateEncryptedPassphrase = ({
    passphraseKey,
    decryptedPassphrase,
}: {
    passphraseKey: Uint8Array;
    decryptedPassphrase: string;
}) =>
    encodeBase64(
        xorEncryptDecrypt({ key: uint8ArrayToString(passphraseKey), data: decodeBase64(decryptedPassphrase) })
    );

export const generateCacheKey = () => uint8ArrayToPaddedBase64URLString(generateRandomBytes(16));

export const generateCacheKeySalt = () => encodeBase64(arrayToBinaryString(generateRandomBytes(8)));

export const getCacheKeyHash = ({ cacheKey, cacheKeySalt }: { cacheKey: string; cacheKeySalt: string }) =>
    getSHA256Base64String(`${cacheKeySalt}${cacheKey}`);

export const generateEncryptedCacheKey = async ({
    cacheKey,
    publicKeys,
}: {
    cacheKey: string;
    publicKeys: OpenPGPKey[];
}) =>
    (
        await encryptMessage({
            message: createMessage(cacheKey),
            publicKeys,
        })
    ).data;

export const decryptCacheKey = async ({
    encryptedCacheKey,
    privateKeys,
}: {
    encryptedCacheKey: string;
    privateKeys: OpenPGPKey[];
}) =>
    (
        await decryptMessage({
            message: await getMessage(encryptedCacheKey),
            privateKeys,
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
    // calendar.protonmail.com must be hardcoded here as using getAppHref would produce links that wouldn't work
    const baseURL = `https://calendar.protonmail.com/api/calendar/v1/url/${urlID}/calendar.ics`;
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
    decryptedPassphrase,
    passphraseID,
}: {
    accessLevel: ACCESS_LEVEL;
    publicKeys: OpenPGPKey[];
    decryptedPassphrase: string;
    passphraseID: string;
}) => {
    const encryptedPurpose = null;
    const passphraseKey = await generateSessionKey(AES256);
    const encryptedPassphrase =
        accessLevel === ACCESS_LEVEL.FULL ? generateEncryptedPassphrase({ passphraseKey, decryptedPassphrase }) : null;

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
    calendar,
    privateKeys,
    calendarPassphrase,
    onError,
}: {
    calendarUrl: CalendarUrl;
    calendar: Calendar;
    privateKeys: OpenPGPKey[];
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
        } catch (e) {
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
    } catch (e) {
        onError(e);
        link = `Error building link: ${e.message}`;
    }

    return {
        ...calendarUrl,
        calendarName: calendar.Name,
        color: calendar.Color,
        purpose,
        link,
    };
};

export const transformLinksFromAPI = async ({
    calendarUrls,
    calendar,
    privateKeys,
    calendarPassphrase,
    onError,
}: {
    calendarUrls: CalendarUrl[];
    calendar: Calendar;
    privateKeys: OpenPGPKey[];
    calendarPassphrase: string;
    onError: (e: Error) => void;
}) => {
    return Promise.all(
        calendarUrls.map((calendarUrl) =>
            transformLinkFromAPI({
                calendarUrl,
                calendar,
                privateKeys,
                calendarPassphrase,
                onError,
            })
        )
    );
};
