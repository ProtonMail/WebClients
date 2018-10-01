import { isPersonalsKey } from '../../../helpers/vCardFields';

/* @ngInject */
function contactDisplay(gettextCatalog, contactDetailsModel, contactTransformLabel) {
    const PROPERTIES = [
        {
            field: 'FN',
            icon: 'fa-user'
        },
        {
            field: 'EMAIL',
            icon: 'fa-envelope'
        },
        {
            field: 'TEL',
            icon: 'fa-phone'
        },
        {
            field: 'BDAY',
            icon: 'fa-birthday-cake'
        },
        {
            field: 'ADR',
            icon: 'fa-home'
        },
        {
            field: 'ORG',
            icon: 'fa-vcard'
        },
        {
            field: 'NOTE',
            icon: 'fa-sticky-note'
        },
        {
            field: 'PHOTO',
            icon: 'fa-photo'
        }
    ].reduce(
        (acc, item) => {
            const key = isPersonalsKey(item.field.toLowerCase()) ? 'personnals' : 'uniq';
            acc[key].push(item);
            return acc;
        },
        { personnals: [], uniq: [] }
    );

    /**
     * Get a label for the group. First try to convert the custom type to lang. If the custom type doesn't exist,
     * try to convert the field itself. If that doesn't exist, just use the field.
     * @param {string} key
     * @param {string} type
     * @returns {string}
     */
    const getLabel = (key = '', type = key) =>
        contactTransformLabel.toLangExplicit(type) || contactTransformLabel.toLangExplicit(key) || key;

    /**
     * Get the value to display. Special handling for the keys `n` and `adr` which show with newlines.
     * @param {string} key
     * @param {string} value
     * @returns {string}
     */
    const getValue = (key, value) => {
        if (key === 'n' || key === 'adr') {
            return value.join('\n').trim();
        }
        return value;
    };

    /**
     * Get all the items to display.
     * Extract every item from the field, and create an object in the display format.
     * @param {vCard} vcard of the contact
     * @param {string} field key of the group
     * @param {string} icon of the group
     */
    const getItems = (vcard = {}, { field = '', icon }, uniq) => {
        return contactDetailsModel
            .extract({ vcard, field }, uniq)
            .map(({ type, key, value, params: { group } = {} }, i) => ({
                key,
                label: getLabel(key, type),
                value: getValue(key, value),
                group,
                icon: i === 0 ? icon : undefined
            }));
    };

    return {
        restrict: 'E',
        replace: true,
        scope: {
            vcard: '<'
        },
        templateUrl: require('../../../templates/contact/contactDisplay.tpl.html'),
        link(scope) {
            const list = PROPERTIES.uniq.map((property) => ({
                ...property,
                items: getItems(scope.vcard, property)
            }));
            const listPerso = PROPERTIES.personnals.map((property) => ({
                ...property,
                items: getItems(scope.vcard, property, true)
            }));

            scope.properties = list.concat(listPerso);
        }
    };
}

export default contactDisplay;
