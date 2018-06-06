import _ from 'lodash';

import { VCARD_KEYS } from '../../constants';
import { orderByPref } from '../../../helpers/vcard';
import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function contactDetailsModel(contactTransformLabel, contactSchema, gettextCatalog) {
    const ESCAPE_REGEX = /:|,|;/gi;
    const UNESCAPE_REGEX = /\\:|\\,|\\;/gi;
    const BACKSLASH_SEMICOLON_REGEX = /\\;/gi;
    const SPECIAL_CHARACTER_REGEX = /🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼/gi;

    const I18N = {
        unknown: gettextCatalog.getString('Unknown', null, 'Default display name vcard')
    };

    const FIELDS = {
        AVOID: ['version', 'n', 'prodid', 'abuid'],
        FN: ['fn'],
        EMAIL: ['email'],
        TEL: ['tel'],
        ADR: ['adr'],
        NOTE: ['note'],
        KEY: ['key'],
        X_PM_ENCRYPT: ['x-pm-encrypt'],
        X_PM_SIGN: ['x-pm-sign'],
        X_PM_SCHEME: ['x-pm-scheme'],
        X_PM_MIMETYPE: ['x-pm-mimetype'],
        X_PM_TLS: ['x-pm-tls'],
        PHOTO: ['photo'],
        PERSONALS: [
            'kind',
            'source',
            'xml',
            'nickname',
            'bday',
            'anniversary',
            'gender',
            'impp',
            'lang',
            'tz',
            'geo',
            'title',
            'role',
            'logo',
            'org',
            'member',
            'related',
            'categories',
            'rev',
            'sound',
            'uid',
            'clientpidmap',
            'url',
            'fburl',
            'caladruri',
            'caluri'
        ]
    };

    const BOOL_FIELDS = ['x-pm-encrypt', 'x-pm-sign'];
    const MAP_KEYS = VCARD_KEYS.reduce((acc, key) => {
        acc[key] = contactTransformLabel.toLang(key);
        return acc;
    }, {});

    const unescapeValue = (value = '') => value.replace(UNESCAPE_REGEX, (val) => val.substr(1));
    const processEscape = (value = '') => value.replace(ESCAPE_REGEX, (val) => `\\${val}`);
    const escapeValue = (value = '') => {
        if (Array.isArray(value)) {
            return value.map(processEscape);
        }
        return processEscape(value);
    };

    const cleanValue = (value = '', key = '') => {
        // ADR and N contains several value separeted by semicolon
        if (key === 'adr' || key === 'n') {
            // https://github.com/ProtonMail/Angular/issues/6298
            // To avoid problem with the split on ; we need to replace \; first and then re-inject the \;
            // There is no negative lookbehind in JS regex
            return value
                .replace(BACKSLASH_SEMICOLON_REGEX, '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼')
                .split(';')
                .map((value) => value.replace(SPECIAL_CHARACTER_REGEX, '\\;'))
                .map(unescapeValue);
        }
        if (BOOL_FIELDS.includes(key)) {
            return value.toLowerCase().trim() !== 'false';
        }
        return unescapeValue(value);
    };

    const buildProperty = (property = {}, type = undefined) => {
        const key = property.getField();
        return {
            value: cleanValue(property.valueOf(), key),
            type: getType(property) || type,
            key,
            params: property.getParams()
        };
    };

    const checkProperty = (property) => {
        if (!Array.isArray(property)) {
            return property && !property.isEmpty();
        }
        return true;
    };

    function getKeys(field = '', vcard = {}) {
        if (field === 'CUSTOMS') {
            return _.difference(
                Object.keys(vcard.data),
                [].concat(
                    FIELDS.AVOID,
                    FIELDS.FN,
                    FIELDS.EMAIL,
                    FIELDS.TEL,
                    FIELDS.ADR,
                    FIELDS.NOTE,
                    FIELDS.PHOTO,
                    FIELDS.PERSONALS,
                    FIELDS.KEY,
                    FIELDS.X_PM_ENCRYPT,
                    FIELDS.X_PM_SCHEME,
                    FIELDS.X_PM_MIMETYPE,
                    FIELDS.X_PM_SIGN,
                    FIELDS.X_PM_TLS
                )
            );
        }
        return FIELDS[field];
    }

    /**
     * Get property type (extract the first one)
     * @param  {Object} property
     * @return {String} type
     */
    function getType(property) {
        const type = property.getType();
        return Array.isArray(type) ? type[0] : type;
    }

    function getParams(item = {}, pref = 0) {
        const params = item.params || {};
        const hasType = item.label && MAP_KEYS[item.type] !== item.label;

        if (hasType) {
            params.type = contactTransformLabel.toVCard(item.label);
        }

        if (pref) {
            params.pref = pref;
        }

        return params;
    }

    const settingValue = (value) => {
        switch (typeof value) {
            case 'boolean':
                return JSON.stringify(value);
            case 'object':
                return value.value;
            default:
                return value;
        }
    };

    /**
     * Prepare the request before to send to the BE
     * @return {Object} params
     */
    function prepare(scope) {
        const params = angular.copy(contactSchema.contactAPI);

        Object.keys(scope.model).forEach((key) => {
            const child = scope.model[key];

            switch (key) {
                case 'Emails':
                    child.forEach((item, index) => {
                        if (!item.value) {
                            return;
                        }
                        const vCardArgs = getParams(item, child.length > 1 && index + 1);
                        const emailProperty = new vCard.Property(item.type, escapeValue(item.value), vCardArgs);
                        emailProperty.group = `item${index + 1}`;
                        params.vCard.addProperty(emailProperty);

                        const email = item.value;
                        const { value: settingsEmail = '' } = item.settings.Email || {};
                        const settings =
                            normalizeEmail(settingsEmail) === normalizeEmail(email) ? { ...item.settings } : {};
                        delete settings.Email;

                        _.each(settings, (setting) => {
                            setting.forEach((entry, index) => {
                                const vCardArgs = getParams(entry, setting.length > 1 && index + 1);
                                delete vCardArgs.type;
                                const entryValue = settingValue(entry.value);
                                if (entryValue === 'null') {
                                    return;
                                }
                                const encryptProperty = new vCard.Property(
                                    entry.type,
                                    escapeValue(entryValue),
                                    vCardArgs
                                );

                                encryptProperty.group = emailProperty.group;
                                params.vCard.addProperty(encryptProperty);
                            });
                        });
                    });
                    break;
                case 'Tels':
                case 'Adrs':
                    child.forEach((item, index) => {
                        if (item.value) {
                            params.vCard.add(
                                item.type,
                                escapeValue(item.value),
                                getParams(item, child.length > 1 && index + 1)
                            );
                        }
                    });
                    break;
                default:
                    child.forEach((item) => {
                        item.value && params.vCard.add(item.type, escapeValue(item.value), getParams(item));
                    });
                    break;
            }
        });

        let fnProperty = params.vCard.get('fn');

        if (Array.isArray(fnProperty)) {
            fnProperty = fnProperty[0];
        }

        if (!fnProperty || fnProperty.isEmpty()) {
            let value = '';
            const emailProperty = params.vCard.get('email');

            if (emailProperty) {
                const emailValue = emailProperty.valueOf();
                value = Array.isArray(emailValue) ? emailValue[0].valueOf() : emailValue;
            }

            params.vCard.add('fn', value || I18N.unknown);
        }

        return params;
    }

    function extract({ vcard = {}, field = '', type = undefined }) {
        const results = _.reduce(
            getKeys(field, vcard),
            (acc, key) => {
                const property = vcard.get(key);

                if (!checkProperty(property)) {
                    return acc;
                }

                const value = property.valueOf();

                if (Array.isArray(value)) {
                    _.each(orderByPref(value), (prop) => acc.push(buildProperty(prop, type)));
                    return acc;
                }

                acc.push(buildProperty(property, type));

                return acc;
            },
            []
        );

        if (field === 'EMAIL') {
            const schemeList = extract({ vcard, field: 'X_PM_SCHEME' });
            _.each(schemeList, (item) => (item.value = { value: item.value }));
            const mimeList = extract({ vcard, field: 'X_PM_MIMETYPE' });
            _.each(mimeList, (item) => (item.value = { value: item.value }));
            _.each(results, (email) => {
                const filter = (entries) =>
                    _.filter(
                        entries,
                        ({ params: { group = '' } }) => group.toLowerCase() === email.params.group.toLowerCase()
                    );
                const schemeList = filter(extract({ vcard, field: 'X_PM_SCHEME', type: 'x-pm-scheme' }));
                _.each(schemeList, (item) => (item.value = { value: item.value }));

                const mimeList = filter(extract({ vcard, field: 'X_PM_MIMETYPE', type: 'x-pm-mimetype' }));
                _.each(mimeList, (item) => (item.value = { value: item.value }));

                email.settings = {
                    Key: filter(extract({ vcard, field: 'KEY', type: 'key' })),
                    Encrypt: filter(extract({ vcard, field: 'X_PM_ENCRYPT', type: 'x-pm-encrypt' })),
                    Sign: filter(extract({ vcard, field: 'X_PM_SIGN', type: 'x-pm-sign' })),
                    TLS: filter(extract({ vcard, field: 'X_PM_TLS', type: 'x-pm-tls' })),
                    // Include the original email to detect changes
                    Email: { ...email },
                    Scheme: schemeList,
                    MIMEType: mimeList
                };
            });
            return results;
        }

        return results;
    }
    return { extract, prepare, unescapeValue, escapeValue };
}
export default contactDetailsModel;
