import _ from 'lodash';

import { VCARD_KEYS, CONTACT_ADD_ID } from '../../constants';
import { unescapeValue, escapeValue, cleanValue } from '../../../helpers/vcard';
import { getKeys, getHumanFields, isPersonalsKey, FIELDS, toHumanKey } from '../../../helpers/vCardFields';

/* @ngInject */
function contactDetailsModel(
    contactTransformLabel,
    contactSchema,
    gettextCatalog,
    vcard,
    contactEncryptionAddressMap,
    contactEncryptionSaver
) {
    const vcardService = vcard;

    const I18N = {
        unknown: gettextCatalog.getString('Unknown', null, 'Default display name vcard')
    };

    const MAP_KEYS = VCARD_KEYS.reduce((acc, key) => {
        acc[key] = contactTransformLabel.toLang(key);
        return acc;
    }, {});

    const buildProperty = (property = {}, type = undefined) => {
        const key = property.getField();
        return {
            value: cleanValue(property.valueOf(), key),
            type: getType(property) || type,
            key,
            params: property.getParams()
        };
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

    /**
     * Prepare the request before to send to the BE
     * @return {Object} params
     */
    function prepare(scope) {
        const params = angular.copy(contactSchema.contactAPI);
        const contactID = scope.contact.ID || CONTACT_ADD_ID;

        Object.keys(scope.model).forEach((key) => {
            const child = scope.model[key];

            switch (key) {
                case 'Emails':
                    child.forEach((item, index) => {
                        const { value: email = '', type } = item;
                        if (!email) {
                            return;
                        }
                        const vCardArgs = getParams(item, child.length > 1 && index + 1);

                        const emailProperty = new vCard.Property(type, escapeValue(email), vCardArgs);
                        emailProperty.group = `item${index + 1}`;
                        const helperCard = new vCard();
                        helperCard.addProperty(emailProperty);

                        const contactEncryptModel = contactEncryptionAddressMap.get(contactID, email);
                        const card = contactEncryptionSaver.build(helperCard, email, contactEncryptModel);
                        params.vCard = vcardService.merge([params.vCard, card]);
                    });
                    break;
                case 'Tels':
                case 'Adrs':
                    child.forEach((item, index) => {
                        if (item.value) {
                            params.vCard.add(
                                item.type,
                                _.dropRightWhile(escapeValue(item.value), (adr) => !adr), // Remove empty lines from the end
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

    /**
     * Extract fields from the vCard
     * @param  {vCard}   options.vcard
     * @param  {String}  options.field
     * @param  {String}  options.type
     * @param  {Boolean} isPersonnal   field value is a key from PERSONNALS
     * @return {Array}
     */
    function extract({ vcard = new vCard(), field = '', type }, isPersonnal) {
        const keys = getKeys(field, vcard, isPersonnal);
        const listKeys = keys || (isPersonalsKey(field) ? getKeys('PERSONALS', vcard) : []);

        return vcardService.extractProperties(vcard, listKeys).map((property) => buildProperty(property, type));
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

            if (model.length && !/^x-|^avoid$/i.test(field)) {
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
