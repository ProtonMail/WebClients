import { getKeys, decodeBase64, binaryStringToArray, getFingerprint, isExpiredKey, OpenPGPKey } from 'pmcrypto';

import { unique } from 'proton-shared/lib/helpers/array';
import { PACKAGE_TYPE, RECIPIENT_TYPE, MIME_TYPES, KEY_FLAGS } from 'proton-shared/lib/constants';
import { Key, Address } from 'proton-shared/lib/interfaces';

import { Message } from '../../models/message';
import { isEO, isSign } from '../message/messages';
import { normalizeEmail } from '../addresses';
import { getByEmail, isOwnAddress, isFallbackAddress } from '../addresses';
import { KeyData } from '../../models/key';
import { findEmailInCache } from '../contacts';
import { ContactEmailCache, ContactEmail } from '../../models/contact';
import { base64ToArray } from '../base64';

export type MapPreference = { [email: string]: SendPreference };

export interface SendPreference {
    encrypt: boolean;
    sign: boolean;
    mimetype: MIME_TYPES;
    publickeys: OpenPGPKey[];
    primaryPinned: boolean;
    scheme: PACKAGE_TYPE;
    pinned: boolean;
    isVerified: boolean;
    warnings: any[];
    ownAddress: boolean;
}

type CachePreference = { [contactID: string]: { [email: string]: PreferenceInfo } };

interface PreferenceInfo {
    encryptFlag: boolean;
    signFlag: boolean;
    emailKeys: string[];
    mimetype: MIME_TYPES;
    scheme: PACKAGE_TYPE;
    isVerified: boolean;
}

const cache: CachePreference = {};

const emailInExtrInfo = (contactEmail: ContactEmail) =>
    cache[contactEmail.ContactID || ''] && cache[contactEmail.ContactID || ''][normalizeEmail(contactEmail.Email)];

const getInExtrInfo = (contactEmail: ContactEmail) =>
    (cache[contactEmail.ContactID || ''] || {})[normalizeEmail(contactEmail.Email)] || {};

const usesDefaults = (contactEmail: ContactEmail) => !contactEmail || contactEmail.Defaults;

/**
 * Determines if a certain key object is allowed to be used for encryption
 */
const encryptionEnabled = ({ Flags }: Key) => Flags & KEY_FLAGS.ENABLE_ENCRYPTION;

/**
 * Returns the default send preferences if no contact is available for the specified email address.
 * The global settings, composer mode and API keys can still change the defaults though.
 */
const getDefaultInfo = async (
    email: string,
    { RecipientType, Keys = [], Warnings: warnings = [] }: KeyData,
    defaultMimeType: MIME_TYPES,
    eoEnabled: boolean,
    globalSign: boolean,
    mailSettings: any,
    addresses: Address[]
): Promise<SendPreference> => {
    const isInternal = RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;
    const isExternal = RecipientType === RECIPIENT_TYPE.TYPE_EXTERNAL;
    const settingsScheme = mailSettings.PGPScheme;
    const settingsMime = settingsScheme === PACKAGE_TYPE.SEND_PGP_MIME ? MIME_TYPES.MIME : MIME_TYPES.PLAINTEXT;
    const address = getByEmail(addresses, email);
    const ownAddress = isOwnAddress(address, Keys);

    if ((isInternal || isExternal) && Keys.length) {
        const fallbackAddress = isFallbackAddress(address, Keys);

        return {
            warnings,
            encrypt: true,
            sign: true,
            mimetype: isExternal ? settingsMime : defaultMimeType,
            publickeys: await getKeys(Keys[0].PublicKey),
            primaryPinned: !fallbackAddress,
            scheme: isInternal ? PACKAGE_TYPE.SEND_PM : settingsScheme,
            pinned: ownAddress,
            ownAddress,
            isVerified: true
        };
    }
    if (eoEnabled) {
        return {
            warnings,
            encrypt: true,
            sign: false,
            mimetype: defaultMimeType,
            publickeys: [],
            primaryPinned: true,
            scheme: PACKAGE_TYPE.SEND_EO,
            pinned: false,
            ownAddress,
            isVerified: true
        };
    }
    return {
        warnings,
        encrypt: false,
        sign: globalSign,
        mimetype: globalSign ? settingsMime : defaultMimeType,
        publickeys: [],
        primaryPinned: true,
        scheme: globalSign ? settingsScheme : PACKAGE_TYPE.SEND_CLEAR,
        pinned: false,
        ownAddress,
        isVerified: true
    };
};

const mimetypeLogic = (
    mimetype: MIME_TYPES,
    defaultMimetype: MIME_TYPES,
    scheme: PACKAGE_TYPE,
    sign: boolean,
    encrypt: boolean
) => {
    /*
     * PGP/MIME can only send using the MIME encoding as it doesn't support separate attachments and we need to encode
     * them in the body
     */
    if (scheme === PACKAGE_TYPE.SEND_PGP_MIME && (sign || encrypt)) {
        return MIME_TYPES.MIME;
    }
    if (scheme === PACKAGE_TYPE.SEND_PGP_INLINE && (sign || encrypt)) {
        return MIME_TYPES.PLAINTEXT;
    }
    // If sending EO, respect the mime type of the composer, since it will be what the API returns when retrieving the message.
    if (scheme === PACKAGE_TYPE.SEND_EO) {
        return defaultMimetype;
    }
    if (defaultMimetype === MIME_TYPES.PLAINTEXT || mimetype === null) {
        // NEVER upconvert
        return defaultMimetype;
    }
    return mimetype;
};

/**
 * Checks if one of the allowed sending keys is pinned. This function returns true if key pinning is disabled
 * or if atleast on of the Sending keys are in the contacts
 * Should be done on extract, so API changes (the other user resetting their password) are noticed.
 */
const isPrimaryPinned = async (base64Keys: string[], Keys: Key[], email: string, addresses: Address[]) => {
    if (base64Keys.length === 0) {
        const address = getByEmail(addresses, email);
        return !isFallbackAddress(address, Keys);
    }

    const sendKeys = Keys.filter(encryptionEnabled).map((key) => key.PublicKey);
    const keys = await Promise.all(sendKeys.map(getKeys));
    const sendKeyObjects = keys.filter(([k = false]: any) => !!k);
    const [pinnedKey] = await getKeys(base64ToArray(base64Keys[0]) as any);
    const pinnedFingerprint = getFingerprint(pinnedKey);

    return (
        sendKeyObjects.length === 0 || sendKeyObjects.map(([k]: any) => getFingerprint(k)).includes(pinnedFingerprint)
    );
};

/**
 * Generates the sendpreferences using the extracted information after parsing the contacts.
 * This function is the counterpart extractInfo
 */
const extractInfo = async (
    { encryptFlag, signFlag, mimetype: inputMimetype, emailKeys, scheme: inputScheme, isVerified }: PreferenceInfo,
    keyData: KeyData,
    defaultMimeType: MIME_TYPES,
    eoEnabled: boolean,
    globalSign: boolean,
    email: string,
    mailSettings: any,
    addresses: Address[]
): Promise<SendPreference> => {
    const { RecipientType, Warnings = [], Keys = [] } = keyData;
    const isInternal = RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;
    const isExternalWithKeys = RecipientType === RECIPIENT_TYPE.TYPE_EXTERNAL && Keys.length > 0;
    const primaryPinned =
        isInternal || isExternalWithKeys ? await isPrimaryPinned(emailKeys, Keys, email, addresses) : true;
    const pmKey = isInternal || isExternalWithKeys ? await getKeys(Keys[0].PublicKey) : [];
    // In case the pgp packet list contains multiple keys, only the first one is taken.
    const keyObjs = await Promise.all(
        emailKeys
            .map((s) => decodeBase64(s) || '')
            .map(binaryStringToArray)
            .map((a) => {
                return getKeys(a).then(([k]) => isExpiredKey(k).then((isExpired: boolean) => (isExpired ? null : [k])));
            })
    );
    const keyObjects = (keyObjs.filter((k) => k !== null) as unknown) as OpenPGPKey[];

    const publickeys = keyObjects.length && primaryPinned ? [keyObjects[0]] : pmKey;
    const warnings = Warnings;
    let encrypt = isInternal || isExternalWithKeys || (encryptFlag && !!keyObjects.length);
    let sign = isInternal || isExternalWithKeys || (signFlag === null ? !!globalSign : signFlag);
    sign = sign || encryptFlag;

    let scheme: PACKAGE_TYPE;
    if (isInternal) {
        scheme = PACKAGE_TYPE.SEND_PM;
    } else {
        scheme = sign || encrypt ? inputScheme : PACKAGE_TYPE.SEND_CLEAR;
    }
    scheme = scheme === null ? mailSettings.PGPScheme : scheme;

    if (eoEnabled && !encrypt) {
        sign = false;
        encrypt = true;
        scheme = PACKAGE_TYPE.SEND_EO;
    }

    const mimetype = mimetypeLogic(inputMimetype, defaultMimeType, scheme, sign, encrypt);
    const pinned = keyObjects.length > 0;
    const ownAddress = false;

    return { publickeys, warnings, encrypt, sign, scheme, mimetype, primaryPinned, isVerified, pinned, ownAddress };
};

/**
 * Extracts the preferences from the contacts and stores it in the cache for reusage.
 * The logic is straightforward but we see for more info
 * https://docs.google.com/document/d/1lEBkG0DC5FOWlumInKtu4a9Cc1Eszp48ZhFy9UpPQso
 */
const getApiInfo = async (
    email: string,
    keyData: KeyData,
    defaultMimeType: MIME_TYPES,
    eoEnabled: boolean,
    globalSign: boolean,
    mailSettings: any,
    addresses: Address[],
    cache: ContactEmailCache
) => {
    const normalizedEmail = normalizeEmail(email);
    // const isInternal = keyData.RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;
    // const isExternalWithKeys = keyData.RecipientType === RECIPIENT_TYPE.TYPE_EXTERNAL && keyData.Keys.length > 0;

    const contactEmail = findEmailInCache(cache, normalizedEmail);
    if (usesDefaults(contactEmail)) {
        const info = await getDefaultInfo(
            email,
            keyData,
            defaultMimeType,
            eoEnabled,
            globalSign,
            mailSettings,
            addresses
        );
        return { [email]: info };
    }

    // TODO: Decrypt contacts

    ////////////////////////////////////
    ////////////// MOCK ////////////////
    ////////////////////////////////////

    const info = await getDefaultInfo(email, keyData, defaultMimeType, eoEnabled, globalSign, mailSettings, addresses);
    return { [email]: info };

    ////////////////////////////////////
    ////////////// MOCK ////////////////
    ////////////////////////////////////

    // const { vCard, errors } = await Contact.get(contactEmail.ContactID);

    // const keyList = toList(vCard.get('key'));
    // const encryptFlagList = toList(vCard.get('x-pm-encrypt'));
    // const signFlagList = toList(vCard.get('x-pm-sign'));
    // const schemeList = toList(vCard.get('x-pm-scheme'));
    // const mimeList = toList(vCard.get('x-pm-mimetype'));
    // const emailList = toList(vCard.get('email'));

    // const group = getGroup(emailList, normalizedEmail);
    // if (!group) {
    //     return { [email]: await getDefaultInfo(email, keyData, defaultMimeType, eoEnabled, globalSign) };
    // }

    // const matchesGroup = groupMatcher(group.toLowerCase());
    // const emailKeys = _.filter(keyList, matchesGroup);
    // const encryptFlag = _.find(encryptFlagList, matchesGroup);
    // const signFlag = _.find(signFlagList, matchesGroup);
    // const mimetypeProp = _.find(mimeList, matchesGroup);
    // const mimetype = mimetypeProp ? mimetypeProp.valueOf() : null;
    // const schemeProp = _.find(schemeList, matchesGroup);
    // const scheme = schemeProp ? toSchemeConstant(schemeProp.valueOf()) : null;
    // const base64Keys = await reorderKeys(
    //     keyData,
    //     (await Promise.all(_.map(emailKeys, (prop) => contactKey.getBase64Value(prop)))).filter(Boolean) // In case the key is expired or revoked we don't get the base 64 value but false
    // );
    // const data = {
    //     encryptFlag:
    //         isInternal ||
    //         isExternalWithKeys ||
    //         ((encryptFlag ? encryptFlag.valueOf().toLowerCase() !== 'false' : false) && emailKeys.length > 0),
    //     signFlag:
    //         isInternal ||
    //         isExternalWithKeys ||
    //         (signFlag ? signFlag.valueOf().toLowerCase() !== 'false' : !!globalSign),
    //     emailKeys: base64Keys,
    //     mimetype: mimetype !== 'text/plain' && mimetype !== 'text/html' ? null : mimetype,
    //     scheme: isInternal ? PACKAGE_TYPE.SEND_PM : scheme,
    //     isVerified: !errors.includes(CONTACT_ERROR.TYPE2_CONTACT_VERIFICATION)
    // };

    // // We don't support encryption without signing
    // data.signFlag = data.signFlag || data.encryptFlag;

    // CACHE.EXTRACTED_INFO[contactEmail.ContactID] = CACHE[contactEmail.ContactID] || {};
    // CACHE.EXTRACTED_INFO[contactEmail.ContactID][normalizedEmail] = data;

    // return { [email]: await extractInfo(data, keyData, defaultMimeType, eoEnabled, globalSign, email) };
};

/**
 * Extracts send preferences from the cache if available
 */
const getCacheInfo = async (
    email: string,
    keyData: KeyData,
    defaultMimeType: MIME_TYPES,
    eoEnabled: boolean,
    globalSign: boolean,
    mailSettings: any,
    addresses: Address[],
    cache: ContactEmailCache
): Promise<MapPreference> => {
    const normalizedEmail = normalizeEmail(email);
    const contactEmail = findEmailInCache(cache, normalizedEmail);

    if (usesDefaults(contactEmail)) {
        return {
            [email]: await getDefaultInfo(
                email,
                keyData,
                defaultMimeType,
                eoEnabled,
                globalSign,
                mailSettings,
                addresses
            )
        };
    }

    if (!emailInExtrInfo(contactEmail)) {
        // return { [email]: null };
        return {};
    }

    return {
        [email]: await extractInfo(
            getInExtrInfo(contactEmail),
            keyData,
            defaultMimeType,
            eoEnabled,
            globalSign,
            email,
            mailSettings,
            addresses
        )
    };
};

const inExtractedInfoCache = (contactEmailList: ContactEmail[]) =>
    contactEmailList.every((e) => usesDefaults(e) || emailInExtrInfo(e));

const inCache = (emails: string[], cache: ContactEmailCache) => {
    const normalizedEmails = emails.map(normalizeEmail);
    const contactEmailList = normalizedEmails.map((email) => findEmailInCache(cache, email));

    return inExtractedInfoCache(contactEmailList);
};

const getInfo = async (
    email: string,
    keyData: KeyData,
    defaultMimeType: MIME_TYPES,
    eoEnabled: boolean,
    globalSign: boolean,
    mailSettings: any,
    addresses: Address[],
    cache: ContactEmailCache
): Promise<MapPreference> => {
    const address = getByEmail(addresses, email);

    if (isOwnAddress(address, keyData.Keys)) {
        const info = await getDefaultInfo(
            email,
            keyData,
            defaultMimeType,
            eoEnabled,
            globalSign,
            mailSettings,
            addresses
        );
        return { [email]: info };
    }

    if (inCache([email], cache)) {
        return getCacheInfo(email, keyData, defaultMimeType, eoEnabled, globalSign, mailSettings, addresses, cache);
    }

    return getApiInfo(email, keyData, defaultMimeType, eoEnabled, globalSign, mailSettings, addresses, cache);
};

/**
 * The goal of this service is to provide all the encryption + encoding preferences for a recipient by parsing the
 * contact of the recipient, considering the general settings, inputs from the message that we want to send and API stuff
 *
 * For the general logic see:
 * https://docs.google.com/document/d/1lEBkG0DC5FOWlumInKtu4a9Cc1Eszp48ZhFy9UpPQso
 * This is the specification it should implement and should be the right way to do this
 *
 * primaryPinned basically just says if the primary key is available for sending (so either pinned or key pinning is disabled
 * It differs from pinned as pinned just says is key pinning is enabled.
 * primaryPinned is a flag that tells the FE that we first need to fix the sendPreference before sending.
 */
export const getSendPreferences = async (
    emails: string[] = [],
    message: Message,
    mailSettings: any,
    addresses: Address[],
    cache: ContactEmailCache,
    getPublicKeys: (email: string) => Promise<KeyData>,
    catchErrors = false
): Promise<MapPreference> => {
    const defaultMimeType: MIME_TYPES = message ? (message.MIMEType as MIME_TYPES) : MIME_TYPES.DEFAULT;
    const eoEnabled = isEO(message);
    const globalSign = message ? isSign(message) : mailSettings.Sign;
    const normEmails: string[] = unique(emails.map(normalizeEmail));
    const normInfos = await Promise.all(
        normEmails.map(async (email) => {
            try {
                const keyData = await getPublicKeys(email);
                return getInfo(email, keyData, defaultMimeType, eoEnabled, globalSign, mailSettings, addresses, cache);
            } catch (e) {
                if (!catchErrors) {
                    throw e;
                }
            }
        })
    );
    const normMap = Object.assign({}, ...normInfos);

    return emails.reduce((acc, cur) => {
        const result = normMap[normalizeEmail(cur)];
        if (!result) {
            return acc;
        }
        acc[cur] = result;
        return acc;
    }, {} as MapPreference);
};
