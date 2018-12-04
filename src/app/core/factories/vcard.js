import _ from 'lodash';

import parseDate from '../../../helpers/vcardDateParser';
import isUniqField from '../../../helpers/vcardUniqueFields';
import { VCARD_VERSION, VCARD_TYPES, KEY_MODE } from '../../constants';
import vCardPropertyMaker from '../../../helpers/vCardPropertyMaker';
import { extractAll, makeUniq } from '../../../helpers/vCardProperties';

/* @ngInject */
function vcard(notification, sanitize) {
    /**
     * Check if the type is valid
     * @param  {String}  [type='']
     * @return {Boolean}
     */
    function isValidType(type = '') {
        if (type.length) {
            return VCARD_TYPES.includes(type.toLowerCase());
        }
        return true;
    }

    /**
     * Purify value of each vCards
     * @param  {vCard}  vcard
     * @return {vCard}
     */
    function clean(vcard = new vCard()) {
        const properties = extractAll(vcard);

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

                acc.add(key, cleanValue(value, key, params), params);

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
     * Format clean value
     * @param {String} value The value of the vcard field
     * @param {String} field The name of the vcard field
     * @param {Object} params Rest of the parameters from the vcard value
     * @return {String}
     */
    function formatCleanValue(value = '', field = '', params = {}) {
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

    function cleanValue(value, field, params) {
        const input = formatCleanValue(value, field, params);
        return sanitize.input(sanitize.toTagUnicode(input));
    }

    /**
     * Merge multiple vCards into one
     * @param {Array} vCards
     * @param {Boolean} unicityGroup When we merge contacts we need to ensure we have uniq groups.
     * @returns {vCard} newCard
     */
    const merge = (vCards = [], unicityGroup = false) => {
        if (vCards.length === 0) {
            return;
        }
        if (vCards.length === 1) {
            return vCards[0];
        }
        const newCard = new vCard();

        const properties = vCardPropertyMaker(vCards, { unicityGroup });

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

    const to = (vcards = []) => {
        return _.reduce(
            vcards,
            (acc, vCard) => {
                return acc + clean(vCard).toString(VCARD_VERSION) + '\r\n';
            },
            ''
        );
    };

    const from = (vcfString = '') => {
        try {
            return vCard.parse(vcfString).map((vcard) => clean(convertCustoms(vcard)));
        } catch (e) {
            notification.error(e);
        }
    };

    /**
     * Handle x-ablabel custom property and convert it to the vCard 4 format
     * Usually, vcards coming from Apple
     * @param  {Array} vcards
     * @return {Array}
     */
    function convertCustoms(vcard = new vCard()) {
        const groups = _.groupBy(extractAll(vcard), (property) => property.getGroup() || 'nogroup');

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

    function updateClearText({ Cards = [] }, contact) {
        const clearText = Cards.find(({ Type }) => Type === KEY_MODE.CLEAR_TEXT);

        if (!clearText) {
            return;
        }

        const card = new vCard().parse(clearText.Data);
        const types = contact.types.includes(KEY_MODE.CLEAR_TEXT)
            ? contact.types
            : [...contact.types, KEY_MODE.CLEAR_TEXT];

        Object.keys(contact.vCard.data).forEach((key) => {
            if (!card.data[key]) {
                const prop = contact.vCard.data[key];
                if (!Array.isArray(prop)) {
                    card.addProperty(prop);
                } else {
                    build(prop, card);
                }
            }
        });

        return {
            ...contact,
            types,
            vCard: card
        };
    }

    return { from, to, merge, build, isValidType, updateClearText };
}

export default vcard;
