import _ from 'lodash';

/* @ngInject */
function contactDetailsModel(contactTransformLabel, CONSTANTS, contactSchema, gettextCatalog) {
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
            'key',
            'fburl',
            'caladruri',
            'caluri'
        ]
    };

    const MAP_KEYS = CONSTANTS.VCARD_KEYS.reduce((acc, key) => {
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
        return unescapeValue(value);
    };

    const buildProperty = (property = {}) => {
        const key = property.getField();
        return { value: cleanValue(property.valueOf(), key), type: getType(property), key, params: property.getParams() };
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
                [].concat(FIELDS.AVOID, FIELDS.FN, FIELDS.EMAIL, FIELDS.TEL, FIELDS.ADR, FIELDS.NOTE, FIELDS.PHOTO, FIELDS.PERSONALS)
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
                case 'Tels':
                case 'Adrs':
                    child.forEach((item, index) => {
                        if (item.value) {
                            params.vCard.add(item.type, escapeValue(item.value), getParams(item, child.length > 1 && index + 1));
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

    function extract({ vcard = {}, field = '' }) {
        return _.reduce(
            getKeys(field, vcard),
            (acc, key) => {
                const property = vcard.get(key);

                if (!checkProperty(property)) {
                    return acc;
                }

                const value = property.valueOf();

                if (Array.isArray(value)) {
                    _.each(orderByPref(value), (prop) => acc.push(buildProperty(prop)));
                    return acc;
                }

                acc.push(buildProperty(property));

                return acc;
            },
            []
        );
    }

    /**
     * Order properties by preference parameter
     * @param {Array} properties
     * @return {Array}
     */
    function orderByPref(properties = []) {
        return _.sortBy(properties, (property) => {
            const { pref = 0 } = property.getParams() || {};
            return pref;
        });
    }

    return { extract, prepare, unescapeValue, escapeValue };
}
export default contactDetailsModel;
