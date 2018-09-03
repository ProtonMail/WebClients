import _ from 'lodash';

import { PACKAGE_TYPE, RECIPIENT_TYPE, MIME_TYPES, KEY_FLAGS, CONTACT_SETTINGS_DEFAULT } from '../../constants';

const ALLOWED_MIMETYPES = [CONTACT_SETTINGS_DEFAULT, MIME_TYPES.PLAINTEXT];
const { SEND_PGP_INLINE } = PACKAGE_TYPE;
const { TYPE_INTERNAL } = RECIPIENT_TYPE;
const { ENABLE_ENCRYPTION } = KEY_FLAGS;

/* @ngInject */
function contactPgpModel(dispatchers, mailSettingsModel, pmcw) {
    const CACHE = {};
    const { dispatcher, on, unsubscribe } = dispatchers(['advancedSetting']);
    const set = (key, value) => (CACHE.model[key] = value);
    const get = (key) => CACHE.model[key];
    const dispatch = () => dispatcher.advancedSetting('update', CACHE);
    const isInternalUser = () => CACHE.internalKeys.RecipientType === TYPE_INTERNAL;
    const getDefaultScheme = () => (mailSettingsModel.get('PGPScheme') === SEND_PGP_INLINE ? 'pgp-inline' : 'pgp-mime');
    const isDisabledUser = () =>
        isInternalUser() && CACHE.internalKeys.Keys.every(({ Flags }) => !(Flags & ENABLE_ENCRYPTION));
    const getModel = () => CACHE.model;
    const hasScheme = () => CACHE.model.Scheme && !isInternalUser();
    const schemeValue = () => CACHE.model.Scheme;
    const isScheme = (scheme) => {
        const val = schemeValue();
        const isDefault = val === CONTACT_SETTINGS_DEFAULT && getDefaultScheme() === scheme;
        return hasScheme() && (val === scheme || isDefault);
    };
    const isPGPInline = () => isScheme('pgp-inline');
    const isPGPMime = () => isScheme('pgp-mime');

    /**
     * Checks if all keys are expired if there are keys
     * @param {Array} keys
     * @return {Promise} true if all keys are expired and there are keys
     */
    const allKeysExpired = async (keys = []) => {
        // We do not want to show any warnings if we don't have any keys
        if (!keys.length) {
            return false;
        }

        const keyObjects = keys
            .map((value) => value.split(','))
            .map(([, base64 = '']) => base64)
            .map(pmcw.decode_base64)
            .map(pmcw.binaryStringToArray)
            .filter((a) => a.length)
            .map(pmcw.getKeys);

        const isExpired = await Promise.all(keyObjects.map(([k]) => pmcw.isExpiredKey(k)));

        return isExpired.every((keyExpired) => keyExpired);
    };

    /**
     * Get raw internal keys
     * @return {Promise}
     */
    const getRawInternalKeys = () =>
        _.map(CACHE.internalKeys.Keys.filter(({ Send }) => Send), 'PublicKey').map(
            _.flowRight(
                pmcw.encode_base64,
                pmcw.arrayToBinaryString,
                pmcw.stripArmor
            )
        );

    /**
     * Fix the mime type such that it corresponds with the encryption scheme. Also makes sure the mimetype
     * is one of the allowed mime types.
     */
    const fixMimeType = () => {
        const encrypt = get('Encrypt');
        const sign = get('Sign');

        if ((encrypt || sign) && !isInternalUser()) {
            // If not pgp-inline, keep the mimetype, if encryption/signing is disabled: keep the mime type.
            if (!isPGPInline()) {
                CACHE.model.MIMEType = CONTACT_SETTINGS_DEFAULT;
            } else {
                CACHE.model.MIMEType = MIME_TYPES.PLAINTEXT;
            }
            // dispatch() is called each time after this function
        }
    };

    /**
     * Initialize data manipulated by contactPgp component
     * @param {Object} model - model storing PGP options
     * @param {String} email - email that we are configuring
     * @param {Object} internalKeys - configuration for internal keys
     */
    const init = (model, email, internalKeys) => {
        CACHE.model = model;
        CACHE.email = email;
        CACHE.internalKeys = internalKeys;

        if (!ALLOWED_MIMETYPES.includes(CACHE.model.MIMEType)) {
            CACHE.model.MIMEType = CONTACT_SETTINGS_DEFAULT;
        }

        fixMimeType();
        dispatch();
    };

    const updateKeys = (data) => {
        const keys = data.keys;

        set('Keys', keys);

        if (!keys.length) {
            set('Encrypt', false);
        }

        dispatch();
    };

    const updateMIMEType = (data) => {
        set('MIMEType', data.value);
        dispatch();
    };

    const updateSign = (data) => {
        set('Sign', data.status);
        fixMimeType();
        dispatch();
    };

    const updateEncrypt = (data) => {
        const encrypt = data.status;

        set('Encrypt', encrypt);

        if (encrypt) {
            set('Sign', true);
        }

        fixMimeType();
        dispatch();
    };

    const updateScheme = (data) => {
        set('Scheme', data.value);
        fixMimeType();
        dispatch();
    };

    const MAP_ACTION = {
        updateKeys,
        updateMIMEType,
        updateSign,
        updateEncrypt,
        updateScheme
    };

    on('advancedSetting', (e, { type, data = {} }) => {
        (MAP_ACTION[type] || _.noop)(data);
    });

    on('logout', () => {
        unsubscribe();
    });

    return {
        init,
        isInternalUser,
        isDisabledUser,
        isPGPInline,
        isPGPMime,
        get,
        getModel,
        getRawInternalKeys,
        allKeysExpired
    };
}
export default contactPgpModel;
