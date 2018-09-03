import _ from 'lodash';

import parseDate from '../../../helpers/vcardDateParser';
import isUniqField from '../../../helpers/vcardUniqueFields';
import { VCARD_VERSION, VCARD_TYPES } from '../../constants';
import { orderByPref } from '../../../helpers/vcard';

/* @ngInject */
function vcard(notification, sanitize) {
    const makeUniq = (properties = []) => _.uniqBy(properties, (property) => property.valueOf());

    /**
     * Check if a property is empty
     * @param {vCard.Property} property
     * @return {Boolean}
     */
    const isEmpty = (property) => {
        if (Array.isArray(property)) {
            return property.filter(isEmpty).length;
        }

        if (property) {
            return property.isEmpty();
        }

        return true;
    };

    const pushProperty = (collection = [], property, group) => {
        if (group && property.getGroup() !== group) {
            return;
        }

        collection.push(property);
    };

    /**
     * Extract specific properties
     * @param {vCard} vcard
     * @param {Array} fields
     * @param {String} options.group
     * @return {Array} properties
     */
    const extractProperties = (vcard = new vCard(), fields = [], { group } = {}) => {
        return fields.reduce((acc, key) => {
            const property = vcard.get(key);

            if (isEmpty(property)) {
                return acc;
            }

            const value = property.valueOf();

            if (Array.isArray(value)) {
                orderByPref(value).forEach((prop) => {
                    pushProperty(acc, prop, group);
                });
                return acc;
            }

            pushProperty(acc, property, group);

            return acc;
        }, []);
    };

    /**
     * Merge multiple vCards into one
     * @param {Array} vCards
     * @returns {vCard} newCard
     */
    const merge = (vCards = []) => {
        if (vCards.length === 0) {
            return;
        }
        if (vCards.length === 1) {
            return vCards[0];
        }
        const newCard = new vCard();

        // Count of the id of the group to ensure that no conflicts exists between them between contacts.
        let groupId = 0;

        // All new properties.
        const properties = _.reduce(
            vCards,
            (acc, vcard = {}) => {
                const groups = {};
                const props = extractAllProperties(vcard);
                _.each(props, (prop) => {
                    const group = prop.getGroup();
                    if (group) {
                        // Rename group to prevent conflicts where properties from different vcards have the same group.
                        groups[group] = groups[group] || `item${++groupId}`;
                        prop.group = groups[group];
                    }
                    const field = prop.getField();
                    acc[field] = acc[field] || [];
                    acc[field].push(prop);
                });
                return acc;
            },
            {}
        );

        /**
         * Build all the properties.
         * If it's a unique field, take the first property.
         * Otherwise ensure that the properties are unique and add them.
         */
        _.each(Object.keys(properties), (field) => {
            if (isUniqField(field)) {
                return build([properties[field][0]], newCard);
            }
            build(makeUniq(properties[field]), newCard);
        });

        return newCard;
    };

    const to = (vcards = []) =>
        _.reduce(vcards, (acc, vCard) => acc + clean(vCard).toString(VCARD_VERSION) + '\r\n', '');
    const from = (vcfString = '') => {
        try {
            return vCard.parse(vcfString).map((vcard) => clean(convertCustoms(vcard)));
        } catch (e) {
            notification.error(e);
        }
    };

    /**
     * Check if the type is valid
     * @param  {String}  [type='']
     * @return {Boolean}
     */
    function isValidType(type = '') {
        if (type.length) {
            return _.includes(VCARD_TYPES, type.toLowerCase());
        }

        return true;
    }

    /**
     * Purify value of each vCards
     * @param  {vCard}  vcard
     * @return {vCard}
     */
    function clean(vcard = new vCard()) {
        const properties = extractAllProperties(vcard);

        return _.reduce(
            properties,
            (acc, property) => {
                const type = property.getType();
                const typeValue =
                    type && (Array.isArray(type) ? type.map((t) => cleanType(t)).filter((t) => t) : cleanType(type));
                const key = property.getField();
                const value = property.valueOf();
                const params = property.getParams();

                delete params.type;

                // Set Type only if it's valid
                if (typeValue && typeValue.length) {
                    params.type = typeValue;
                }

                acc.add(key, sanitize.input(cleanValue(value, key, params)), params);

                return acc;
            },
            new vCard()
        );
    }

    /**
     * Clean type value and prefix it by adding `x` if it's invalid
     * @param  {String} type
     * @return {String}
     */
    function cleanType(type = '') {
        // Gmail set by default INTERNET as Type for email
        // We just remove it and then the default Email value will be display
        if (type === 'x-INTERNET') {
            return '';
        }

        if (isValidType(type)) {
            return type;
        }

        // We've accidentally set custom fn-types on created contacts and x-fn types on exported data. Remove them.
        if (type === 'fn' || type === 'x-fn') {
            return '';
        }

        if (type.toLowerCase().startsWith('x')) {
            return type;
        }

        return `x-${type}`;
    }

    /**
     * Clean value
     * @param {String} value The value of the vcard field
     * @param {String} field The name of the vcard field
     * @param {Object} params Rest of the parameters from the vcard value
     * @return {String}
     */
    function cleanValue(value = '', field = '', params = {}) {
        const matches = value.match(/_\$!<(.*)>!\$_/);

        // Some imported vCards from Apple have weird bracket around the value _$!<value>!$_
        if (Array.isArray(matches)) {
            return matches[1];
        }

        // Handle X-APPLE-OMIT-YEAR https://github.com/ProtonMail/Angular/issues/6116
        if (field === 'bday' && params.xAppleOmitYear === '1604') {
            const { month, day } = parseDate(value) || {};
            // If it was possible to parse the date, return it in a truncated format.
            if (month && day) {
                // Delete the apple specific tag since it's now parsed properly.
                delete params.xAppleOmitYear;
                return `--${month}-${day}`;
            }
            // Else just return the original value.
            return value;
        }

        if (field === 'org') {
            // ORG:ABC\, Inc.;North American Division;Marketing
            return value
                .split(';')
                .map((str = '') => str.trim())
                .filter(Boolean)
                .join(', ');
        }

        return value;
    }

    /**
     * Get all Properties for a specific vCard
     * @param  {vCard} vcard
     * @return {Array}
     */
    function extractAllProperties(vcard = new vCard()) {
        return _.reduce(
            Object.keys(vcard.data),
            (acc, key) => {
                const value = vcard.get(key);
                const props = Array.isArray(value) ? value : [value];

                return acc.concat(props);
            },
            []
        );
    }

    /**
     * Handle x-ablabel custom property and convert it to the vCard 4 format
     * Usually, vcards coming from Apple
     * @param  {Array} vcards
     * @return {Array}
     */

    /* eslint no-unused-vars: "off" */
    function convertCustoms(vcard = new vCard()) {
        const groups = _.groupBy(extractAllProperties(vcard), (property) => property.getGroup() || 'nogroup');

        return _.reduce(
            Object.keys(groups),
            (acc, groupName) => {
                const group = groups[groupName];

                if (groupName === 'nogroup' || group.length === 1) {
                    _.each(group, (prop) => acc.addProperty(prop));

                    return acc;
                }

                const property1 = _.find(group, (prop) => prop.getField().toLowerCase() === 'x-ablabel');

                if (property1) {
                    const property2 = _.find(group, (prop) => prop.getField().toLowerCase() !== 'x-ablabel');
                    const key = property2.getField();
                    const value = property2.valueOf();
                    const params = property2.getParams() || {};
                    const type = property1.valueOf();

                    params.type = type;
                    acc.add(key, value, params);

                    return acc;
                }

                _.each(group, (prop) => acc.addProperty(prop));

                return acc;
            },
            new vCard()
        );
    }

    function build(properties = [], target = new vCard()) {
        _.each(properties, (property) => target.addProperty(property));

        return target;
    }

    return { from, to, extractProperties, extractAllProperties, merge, build, isValidType, isEmpty };
}

export default vcard;
