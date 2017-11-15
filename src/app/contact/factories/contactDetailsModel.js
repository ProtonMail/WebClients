angular.module('proton.contact')
    .factory('contactDetailsModel', (contactTransformLabel, CONSTANTS, contactSchema, gettextCatalog) => {
        const ESCAPE_REGEX = /:|,|;|"/gi;
        const UNESCAPE_REGEX = /\\:|\\,|\\;|\\"/gi;
        const I18N = { unknown: gettextCatalog.getString('Unknown', null, 'Default display name vcard') };
        const FIELDS = {
            AVOID: ['version', 'n', 'prodid', 'abuid'],
            FN: ['fn'],
            EMAIL: ['email'],
            TEL: ['tel'],
            ADR: ['adr'],
            NOTE: ['note'],
            PERSONALS: ['kind', 'source', 'xml', 'nickname', 'photo', 'bday', 'anniversary', 'gender', 'impp', 'lang', 'tz', 'geo', 'title', 'role', 'logo', 'org', 'member', 'related', 'categories', 'rev', 'sound', 'uid', 'clientpidmap', 'url', 'key', 'fburl', 'caladruri', 'caluri']
        };

        const unescapeValue = (value = '') => value.replace(UNESCAPE_REGEX, (val) => val.substr(1));
        const escapeValue = (value = '') => value.replace(ESCAPE_REGEX, (val) => `\\${val}`);
        const cleanValue = (value = '', key = '') => {
            // ADR and N contains several value separeted by semicolon
            if (key === 'adr' || key === 'n') {
                return value.split(';').map(unescapeValue);
            }
            return unescapeValue(value);
        };
        const buildProperty = (property = {}) => {
            const key = property.getField();
            return { value: cleanValue(property.valueOf(), key), type: getType(property), key, params: property.getParams() };
        };
        const checkProperty = (property) => (Array.isArray(property) ? true : property && !property.isEmpty());
        const keys = CONSTANTS.VCARD_KEYS.reduce((acc, key) => {
            acc[key] = contactTransformLabel.toLang(key);
            return acc;
        }, {});

        function getKeys(field = '', vcard = {}) {
            switch (field) {
                case 'CUSTOMS':
                    return _.difference(Object.keys(vcard.data), [].concat(FIELDS.AVOID, FIELDS.FN, FIELDS.EMAIL, FIELDS.TEL, FIELDS.ADR, FIELDS.NOTE, FIELDS.PERSONALS));
                default:
                    return FIELDS[field];
            }
        }

        /**
         * Get property type (extract the first one)
         * @param  {Object} property
         * @return {String} type
         */
        function getType(property) {
            const type = property.getType();

            if (Array.isArray(type)) {
                return type[0];
            }

            return type;
        }

        function getParams(item = {}, pref = 0) {
            const params = item.params || {};
            const hasType = item.label && keys[item.type] !== item.label;

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
                            (item.value) && params.vCard.add(item.type, escapeValue(item.value), getParams(item, child.length > 1 && (index + 1)));
                        });
                        break;
                    default:
                        child.forEach((item) => {
                            (item.value) && params.vCard.add(item.type, escapeValue(item.value), getParams(item));
                        });
                        break;
                }
            });

            if (params.vCard.get('fn').isEmpty()) {
                let value = I18N.unknown;
                const emailProperty = params.vCard.get('email');

                if (emailProperty) {
                    const emailValue = emailProperty.valueOf();

                    value = (Array.isArray(emailValue) ? emailValue[0].valueOf() : emailValue) || I18N.unknown;
                }

                params.vCard.add('fn', value);
            }

            return params;
        }

        function extract({ vcard = {}, field = '' }) {
            return _.reduce(getKeys(field, vcard), (acc, key) => {
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
            }, []);
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
    });
