angular.module('proton.contact')
    .factory('contactDetailsModel', (contactTranformLabel, CONSTANTS, contactSchema) => {
        const FIELDS = {
            AVOID: ['version', 'n', 'prodid', 'abuid'],
            FN: ['fn'],
            EMAIL: ['email'],
            TEL: ['tel'],
            ADR: ['adr'],
            NOTE: ['note'],
            PERSONALS: ['kind', 'source', 'xml', 'nickname', 'photo', 'bday', 'anniversary', 'gender', 'impp', 'lang', 'tz', 'geo', 'title', 'role', 'logo', 'org', 'member', 'related', 'categories', 'rev', 'sound', 'uid', 'clientpidmap', 'url', 'key', 'fburl', 'caladruri', 'caluri']
        };

        const cleanValue = (value) => {
            // Some key contains several value separeted by comma
            if (Array.isArray(value)) {
                return DOMPurify.sanitize(value).split(';');
            }
            return DOMPurify.sanitize(value);
        };
        const buildProperty = (property = {}) => ({ value: cleanValue(property.valueOf()), type: getType(property), key: property.getField(), params: property.getParams() });
        const checkProperty = (property) => (Array.isArray(property) ? true : property && !property.isEmpty());
        const keys = CONSTANTS.VCARD_KEYS.reduce((acc, key) => {
            acc[key] = contactTranformLabel.toLang(key);
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
                params.type = contactTranformLabel.toVCard(item.label);
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
                    case 'Name':
                        params.vCard.add('fn', _.first(child).value || '', getParams(child));
                        break;
                    case 'Emails':
                    case 'Tels':
                    case 'Adrs':
                        child.forEach((item, index) => {
                            (item.value) && params.vCard.add(item.type, item.value, getParams(item, child.length > 1 && (index + 1)));
                        });
                        break;
                    default:
                        child.forEach((item) => {
                            (item.value) && params.vCard.add(item.type, item.value, getParams(item));
                        });
                        break;
                }
            });

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

        return { extract, prepare };
    });
