import _ from 'lodash';

import { VCARD_KEYS, CONTACT_SETTINGS_DEFAULT } from '../../constants';
import { orderByPref } from '../../../helpers/vcard';
import { normalizeEmail } from '../../../helpers/string';
import { getKeys, BOOL_FIELDS, getHumanFields, isPersonalsKey, FIELDS, toHumanKey } from '../../../helpers/vCardFields';

/* @ngInject */
function contactDetailsModel(contactTransformLabel, contactSchema, gettextCatalog) {
    const ESCAPE_REGEX = /:|,|;/gi;
    const UNESCAPE_REGEX = /\\:|\\,|\\;/gi;
    const BACKSLASH_SEMICOLON_REGEX = /\\;/gi;
    const SPECIAL_CHARACTER_REGEX = /🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼/gi;

    const I18N = {
        unknown: gettextCatalog.getString('Unknown', null, 'Default display name vcard')
    };

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
                        const { value: email = '', settings = {}, type } = item;
                        if (!email) {
                            return;
                        }
                        const vCardArgs = getParams(item, child.length > 1 && index + 1);
                        const emailProperty = new vCard.Property(type, escapeValue(email), vCardArgs);
                        emailProperty.group = `item${index + 1}`;
                        params.vCard.addProperty(emailProperty);

                        const { value: settingsEmail = '' } = settings.Email || {};
                        const settingsToSave =
                            normalizeEmail(settingsEmail) === normalizeEmail(email) ? { ...settings } : {};
                        delete settingsToSave.Email;

                        _.each(settingsToSave, (setting) => {
                            setting.forEach((entry, index) => {
                                const vCardArgs = getParams(entry, setting.length > 1 && index + 1);
                                delete vCardArgs.type;
                                const entryValue = settingValue(entry.value);
                                if (entryValue === CONTACT_SETTINGS_DEFAULT) {
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

    function extract({ vcard = {}, field = '', type }) {
        const keys = getKeys(field, vcard);
        const listKeys = keys || (isPersonalsKey(field) ? getKeys('PERSONALS', vcard) : []);

        const results = _.reduce(
            listKeys,
            (acc, key) => {
                const property = vcard.get(key);

                if (!checkProperty(property)) {
                    return acc;
                }

                const value = property.valueOf();

                if (Array.isArray(value)) {
                    _.each(orderByPref(value), (prop) => {
                        acc.push(buildProperty(prop, type));
                    });
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

    /**
     * Extract Human friendly keys from a vCard (name, adr etc.)
     * @param  {vCard} vcard
     * @param  {Function} filter Advanced filter if we need to remove more keys
     * @return {Array}
     */
    const extractHumans = (vcard, filter = _.identity) => {
        const fields = getHumanFields(vcard);
        const getType = (key) => (/^(email|fn)$/.test(key) ? 'clear' : 'encrypted');

        const { clear, encrypted, personalsList } = fields.reduce(
            (acc, field) => {
                if (isPersonalsKey(field)) {
                    acc.personalsList.push(field);
                    return acc;
                }

                acc[getType(field)][field] = extract({
                    field: field.toUpperCase(),
                    vcard
                });
                return acc;
            },
            {
                clear: Object.create(null),
                encrypted: Object.create(null),
                personalsList: []
            }
        );

        if (personalsList.length) {
            const list = extract({
                field: personalsList[0].toUpperCase(),
                vcard
            });

            const map = list.filter(filter).reduce((acc, obj) => ((acc[obj.key] = [obj]), acc), Object.create(null));
            return {
                clear,
                encrypted: { ...encrypted, ...map }
            };
        }

        return { clear, encrypted };
    };

    /**
     * Get a label for the group. First try to convert the custom type to lang. If the custom type doesn't exist,
     * try to convert the field itself. If that doesn't exist, just use the field.
     * @param {string} key
     * @param {string} type
     * @returns {string}
     */
    const getLabel = (key = '', type = key) => {
        return contactTransformLabel.toLangExplicit(type) || contactTransformLabel.toLangExplicit(key) || key;
    };

    const extractAll = (vcard) => {
        return Object.keys(FIELDS).reduce((acc, field) => {
            const model = extract({ vcard, field });

            if (model.length && !/^x_|^avoid$/i.test(field)) {
                acc[toHumanKey(field)] = model.map((item) => {
                    const label = getLabel(item.key);
                    return {
                        ...item,
                        label,
                        type: contactTransformLabel.toVCard(label)
                    };
                });
            }
            return acc;
        }, Object.create(null));
    };

    return { extract, prepare, unescapeValue, escapeValue, extractHumans, extractAll };
}
export default contactDetailsModel;
