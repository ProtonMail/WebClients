import _ from 'lodash';
import { binaryStringToArray, decodeBase64, getFingerprint, getKeys, isExpiredKey, keyInfo } from 'pmcrypto';

import { RECIPIENT_TYPE, PACKAGE_TYPE, KEY_FLAGS } from '../../constants';
import { CONTACT_ERROR } from '../../errors';
import { toList } from '../../../helpers/arrayHelper';
import { getGroup, groupMatcher } from '../../../helpers/vcard';
import { normalizeEmail } from '../../../helpers/string';
import { isOwnAddress, isFallbackAddress } from '../../../helpers/address';

/* @ngInject */
function sendPreferences(dispatchers, addressesModel, contactEmails, Contact, contactKey, keyCache, mailSettingsModel) {
    // We cache all the information coming from the Contacts, so we can avoid accessing the contacts multiple times.
    const CACHE = {};
    const { on } = dispatchers();
    const usesDefaults = (contactEmail) => !contactEmail || contactEmail.Defaults;

    const isInternalUser = async (email) => {
        const normalizedEmail = normalizeEmail(email);
        const {
            [normalizedEmail]: { RecipientType }
        } = await keyCache.get([normalizedEmail]);
        return RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;
    };

    const toSchemeConstant = (value) => {
        switch (value) {
            case 'pgp-mime':
                return PACKAGE_TYPE.SEND_PGP_MIME;
            case 'pgp-inline':
                return PACKAGE_TYPE.SEND_PGP_INLINE;
            default:
                return null;
        }
    };
    /**
     * Determines if a certain key object is allowed to be used for encryption
     * @param {Object} A key object
     */
    const encryptionEnabled = ({ Flags }) => Flags & KEY_FLAGS.ENABLE_ENCRYPTION;

    const mimetypeLogic = (mimetype, defaultMimetype, info) => {
        /*
         * PGP/MIME can only send using the MIME encoding as it doesn't support separate attachments and we need to encode
         * them in the body
         */
        if (info.scheme === PACKAGE_TYPE.SEND_PGP_MIME && (info.sign || info.encrypt)) {
            return 'multipart/mixed';
        }
        if (info.scheme === PACKAGE_TYPE.SEND_PGP_INLINE && (info.sign || info.encrypt)) {
            return 'text/plain';
        }
        if (defaultMimetype === 'text/plain' || mimetype === null) {
            // NEVER upconvert
            return defaultMimetype;
        }
        return mimetype;
    };

    /**
     * Returns the default send preferences if no contact is available for the specified email address.
     * The global settings, composer mode and API keys can still change the defaults though.
     * @param {String} email
     * @param {Array} data.Keys
     * @param {Array} data.Warnings
     * @param defaultMimeType
     * @param eoEnabled
     * @param globalSign
     * @returns {Promise<Object>}
     */
    const getDefaultInfo = async (
        email,
        { Keys = {}, Warnings: warnings = [] },
        defaultMimeType,
        eoEnabled,
        globalSign
    ) => {
        const isInternal = await isInternalUser(email);
        const settingsScheme = mailSettingsModel.get('PGPScheme');
        const settingsMime = settingsScheme === PACKAGE_TYPE.SEND_PGP_MIME ? 'multipart/mixed' : 'text/plain';
        const address = addressesModel.getByEmail(email);
        const ownAddress = isOwnAddress(address, Keys);

        if (isInternal && Keys.length) {
            const fallbackAddress = isFallbackAddress(address, Keys);

            return {
                warnings,
                encrypt: true,
                sign: true,
                mimetype: defaultMimeType,
                publickeys: await getKeys(Keys[0].PublicKey),
                primaryPinned: !fallbackAddress,
                scheme: PACKAGE_TYPE.SEND_PM,
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

    const base64ToArray = _.flowRight(
        binaryStringToArray,
        decodeBase64
    );
    const keyInfoBase64 = _.flowRight(
        keyInfo,
        base64ToArray
    );

    /**
     * Checks if one of the allowed sending keys is pinned. This function returns true if key pinning is disabled
     * or if atleast on of the Sending keys are in the contacts
     * Should be done on extract, so API changes (the other user resetting their password) are noticed.
     * @param base64Keys
     * @param Keys
     * @returns {boolean}
     */
    const isPrimaryPinned = async (base64Keys, { Keys }, email) => {
        if (base64Keys.length === 0) {
            const address = addressesModel.getByEmail(email);
            return !isFallbackAddress(address, Keys);
        }

        const sendKeys = _.map(Keys.filter(encryptionEnabled), 'PublicKey');
        const keys = await Promise.all(sendKeys.map(getKeys));
        const sendKeyObjects = keys.filter(([k = false]) => !!k);
        const [pinnedKey] = await getKeys(base64ToArray(base64Keys[0]));
        const pinnedFingerprint = getFingerprint(pinnedKey);

        return (
            sendKeyObjects.length === 0 || sendKeyObjects.map(([k]) => getFingerprint(k)).includes(pinnedFingerprint)
        );
    };

    /**
     * Generates the sendpreferences using the extracted information after parsing the contacts.
     * This function is the counterpart extractInfo
     * @param encryptFlag
     * @param signFlag
     * @param mimetype
     * @param emailKeys
     * @param scheme
     * @param primaryPinned
     * @param isVerified
     * @param keyData
     * @param defaultMimeType
     * @param eoEnabled
     * @param globalSign
     * @param {String} email
     * @returns {Object}
     */
    const extractInfo = async (
        { encryptFlag, signFlag, mimetype, emailKeys, scheme, isVerified },
        keyData,
        defaultMimeType,
        eoEnabled,
        globalSign,
        email
    ) => {
        const info = {};
        const { RecipientType, Warnings = [] } = keyData;
        const isInternal = RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;
        const primaryPinned = isInternal ? await isPrimaryPinned(emailKeys, keyData, email) : true;
        const pmKey = isInternal ? await getKeys(keyData.Keys[0].PublicKey) : [];
        // In case the pgp packet list contains multiple keys, only the first one is taken.
        const keyObjs = await Promise.all(
            emailKeys
                .map(decodeBase64)
                .map(binaryStringToArray)
                .map((a) => {
                    return getKeys(a).then(([k]) => isExpiredKey(k).then((isExpired) => (isExpired ? null : [k])));
                })
        );
        const keyObjects = keyObjs.filter((k) => k !== null);

        info.publickeys = keyObjects.length && primaryPinned ? keyObjects[0] : pmKey;
        info.warnings = Warnings;
        info.encrypt = isInternal || (encryptFlag && !!keyObjects.length);
        info.sign = isInternal || (signFlag === null ? !!globalSign : signFlag);
        info.sign = info.sign || encryptFlag;

        if (isInternal) {
            info.scheme = PACKAGE_TYPE.SEND_PM;
        } else {
            info.scheme = info.sign || info.encrypt ? scheme : PACKAGE_TYPE.SEND_CLEAR;
        }

        info.scheme = info.scheme === null ? mailSettingsModel.get('PGPScheme') : info.scheme;

        if (eoEnabled && !info.encrypt) {
            info.sign = false;
            info.encrypt = true;
            info.scheme = PACKAGE_TYPE.SEND_EO;
        }

        info.mimetype = mimetypeLogic(mimetype, defaultMimeType, info);
        info.primaryPinned = primaryPinned;
        info.isVerified = isVerified;
        info.pinned = keyObjects.length > 0;
        info.ownAddress = false;

        return info;
    };

    /**
     * Makes sure the send keys as given by the API are before the non Send keys.
     * @param keyData
     * @param base64Keys
     * @returns {Promise.<void>}
     */
    const reorderKeys = async (keyData, base64Keys) => {
        const sendKeys = _.map(keyData.Keys.filter(encryptionEnabled), 'PublicKey');
        const sendKeyPromise = Promise.all(sendKeys.map(keyInfo));
        const pinnedKeyPromise = Promise.all(base64Keys.map(keyInfoBase64));
        const [pinnedKeyInfo, sendKeyInfo] = await Promise.all([pinnedKeyPromise, sendKeyPromise]);

        const isSendKey = ({ fingerprint }) => _.map(sendKeyInfo, 'fingerprint').includes(fingerprint);

        // For external users everything flows into pinnedVerKeys leaving the ordering intact.
        const pinnedSendKeys = base64Keys.filter((value, index) => isSendKey(pinnedKeyInfo[index]));
        const pinnedVerKeys = base64Keys.filter((value, index) => !isSendKey(pinnedKeyInfo[index]));

        return pinnedSendKeys.concat(pinnedVerKeys);
    };

    /**
     * Extracts the preferences from the contacts and stores it in the cache for reusage.
     * The logic is straightforward but we see for more info
     * https://docs.google.com/document/d/1lEBkG0DC5FOWlumInKtu4a9Cc1Eszp48ZhFy9UpPQso
     * @param email
     * @param keyData
     * @param defaultMimeType
     * @param eoEnabled
     * @param globalSign
     * @returns {Promise.<{}>}
     */
    const getApiInfo = async (email, keyData, defaultMimeType, eoEnabled, globalSign) => {
        const normalizedEmail = normalizeEmail(email);
        const isInternal = keyData.RecipientType === RECIPIENT_TYPE.TYPE_INTERNAL;

        const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);
        if (usesDefaults(contactEmail)) {
            return { [email]: await getDefaultInfo(email, keyData, defaultMimeType, eoEnabled, globalSign) };
        }

        const { vCard, errors } = await Contact.get(contactEmail.ContactID);

        const keyList = toList(vCard.get('key'));
        const encryptFlagList = toList(vCard.get('x-pm-encrypt'));
        const signFlagList = toList(vCard.get('x-pm-sign'));
        const schemeList = toList(vCard.get('x-pm-scheme'));
        const mimeList = toList(vCard.get('x-pm-mimetype'));
        const emailList = toList(vCard.get('email'));

        const group = getGroup(emailList, normalizedEmail);
        if (!group) {
            return { [email]: await getDefaultInfo(email, keyData, defaultMimeType, eoEnabled, globalSign) };
        }

        const matchesGroup = groupMatcher(group.toLowerCase());
        const emailKeys = _.filter(keyList, matchesGroup);
        const encryptFlag = _.find(encryptFlagList, matchesGroup);
        const signFlag = _.find(signFlagList, matchesGroup);
        const mimetypeProp = _.find(mimeList, matchesGroup);
        const mimetype = mimetypeProp ? mimetypeProp.valueOf() : null;
        const schemeProp = _.find(schemeList, matchesGroup);
        const scheme = schemeProp ? toSchemeConstant(schemeProp.valueOf()) : null;
        const base64Keys = await reorderKeys(
            keyData,
            (await Promise.all(_.map(emailKeys, (prop) => contactKey.getBase64Value(prop)))).filter(Boolean) // In case the key is expired or revoked we don't get the base 64 value but false
        );
        const data = {
            encryptFlag:
                isInternal ||
                ((encryptFlag ? encryptFlag.valueOf().toLowerCase() !== 'false' : false) && emailKeys.length > 0),
            signFlag: isInternal || (signFlag ? signFlag.valueOf().toLowerCase() !== 'false' : null),
            emailKeys: base64Keys,
            mimetype: mimetype !== 'text/plain' && mimetype !== 'text/html' ? null : mimetype,
            scheme: isInternal ? PACKAGE_TYPE.SEND_PM : scheme,
            isVerified: !errors.includes(CONTACT_ERROR.TYPE2_CONTACT_VERIFICATION)
        };

        // We don't support encryption without signing
        data.signFlag = data.signFlag || data.encryptFlag;

        CACHE.EXTRACTED_INFO[contactEmail.ContactID] = CACHE[contactEmail.ContactID] || {};
        CACHE.EXTRACTED_INFO[contactEmail.ContactID][normalizedEmail] = data;

        return { [email]: await extractInfo(data, keyData, defaultMimeType, eoEnabled, globalSign, email) };
    };

    /**
     * Extracts send preferences from the cache if available
     * @param email
     * @param keyData
     * @param defaultMimeType
     * @param eoEnabled
     * @param globalSign
     * @returns {Promise.<{}>}
     */
    const getCacheInfo = async (email, keyData, defaultMimeType, eoEnabled, globalSign) => {
        const normalizedEmail = normalizeEmail(email);

        const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);
        if (usesDefaults(contactEmail)) {
            return { [email]: await getDefaultInfo(email, keyData, defaultMimeType, eoEnabled, globalSign) };
        }

        if (
            !_.has(CACHE.EXTRACTED_INFO, contactEmail.ContactID) ||
            !_.has(CACHE.EXTRACTED_INFO[contactEmail.ContactID], email)
        ) {
            return { [email]: null };
        }
        return {
            [email]: await extractInfo(
                CACHE.EXTRACTED_INFO[contactEmail.ContactID][email],
                keyData,
                defaultMimeType,
                eoEnabled,
                globalSign,
                email
            )
        };
    };

    const emailInExtrInfo = (contactEmail) =>
        _.has(CACHE.EXTRACTED_INFO, contactEmail.ContactID) &&
        _.has(CACHE.EXTRACTED_INFO[contactEmail.ContactID], normalizeEmail(contactEmail.Email));
    const inExtractedInfoCache = (contactEmailList) =>
        _.every(contactEmailList, (e) => usesDefaults(e) || emailInExtrInfo(e));

    const inCache = (emails) => {
        const normalizedEmails = _.map(emails, normalizeEmail);
        const contactEmailList = _.map(normalizedEmails, (email) => contactEmails.findEmail(email, normalizeEmail));

        return inExtractedInfoCache(contactEmailList);
    };

    const getInfo = (email, keyData, defaultMimeType, eoEnabled, globalSign) => {
        const address = addressesModel.getByEmail(email);

        if (isOwnAddress(address, keyData.Keys)) {
            return getDefaultInfo(email, keyData, defaultMimeType, eoEnabled, globalSign).then((info) => ({
                [email]: info
            }));
        }

        if (inCache([email])) {
            return getCacheInfo(email, keyData, defaultMimeType, eoEnabled, globalSign);
        }

        return getApiInfo(email, keyData, defaultMimeType, eoEnabled, globalSign);
    };

    /**
     * The goal of this service is to provide all the encryption + encoding preferences for a recipient by parsing the
     * contact of the recipient, considering the general settings, inputs from the message that we want to send and API stuff
     *
     * For the general logic see:
     * https://docs.google.com/document/d/1lEBkG0DC5FOWlumInKtu4a9Cc1Eszp48ZhFy9UpPQso
     * This is the specification it should implement and should be the right way to do this
     *
     * Returns a map that maps each input email to their sendpreferences.
     * each sendpreference is an object with the key/value pairs:
     * {
     *             encrypt: boolean,
     *             sign: boolean,
     *             mimetype: 'multipart/mixed' | 'text/html' | 'text/plain' ,
     *             publickeys: [],
     *             primaryPinned: boolean,
     *             scheme: SEND_PGP_MIME | SEND_PGP_INLINE | SEND_PM
     *             pinned: boolean,
     *             isVerified: boolean
     *     }
     * primaryPinned basically just says if the primary key is available for sending (so either pinned or key pinning is disabled
     * It differs from pinned as pinned just says is key pinning is enabled.
     * primaryPinned is a flag that tells the FE that we first need to fix the sendPreference before sending.
     * @param {Array} emails
     * @param {Message} message
     * @param {Boolean} catchErrors Boolean whether errors should be catched. The addresses that failed will silently be ignored in the return object.
     * @returns {Promise.<void>}
     */
    const get = async (emails = [], message, catchErrors = false) => {
        const defaultMimeType = message ? message.MIMEType : null;
        const eoEnabled = message && message.isEO();
        const globalSign = message ? message.isSign() : mailSettingsModel.get('Sign');
        const normEmails = _.uniq(_.map(emails, normalizeEmail));
        const normInfos = await Promise.all(
            normEmails.map(async (email) => {
                try {
                    const keyData = await keyCache.getKeysPerEmail(email);
                    return getInfo(email, keyData, defaultMimeType, eoEnabled, globalSign);
                } catch (e) {
                    if (!catchErrors) {
                        throw e;
                    }
                }
            })
        );
        const normMap = _.extend(...normInfos);

        return emails.reduce((acc, cur) => {
            const result = normMap[normalizeEmail(cur)];
            if (!result) {
                return acc;
            }
            acc[cur] = result;
            return acc;
        }, {});
    };

    const contactEvents = (events) => events.forEach(({ ID }) => delete CACHE.EXTRACTED_INFO[ID]);

    const contactUpdated = ({ ID }) => delete CACHE.EXTRACTED_INFO[ID];

    on('contacts', (event, { type, data: { events = [], contact = {} } = {} }) => {
        type === 'contactEvents' && contactEvents(events);
        type === 'contactUpdated' && contactUpdated(contact);
    });

    const clearCache = () => {
        CACHE.EXTRACTED_INFO = {};
    };

    clearCache();

    on('logout', () => {
        clearCache();
    });

    return { get, clearCache };
}
export default sendPreferences;
