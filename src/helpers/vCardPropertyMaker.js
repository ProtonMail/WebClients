import _ from 'lodash';

import { CLEAR_FIELDS, SIGNED_FIELDS, ENCRYPTED_FIELDS } from './vCardFields';
import { extractAll } from './vCardProperties';

const propertiesReducer = (createKey, index, unicityGroup) => (acc, prop) => {
    const group = prop.getGroup();
    if (group) {
        // Rename group to prevent conflicts where properties from different vcards have the same group.
        const key = `${group.toLowerCase()}-${unicityGroup && index}`;
        !acc.newGroups[key] && (acc.newGroups[key] = `item${++acc.groupId}`);
        prop.group = acc.newGroups[key];
    }

    const field = createKey(prop);
    !acc.properties[field] && (acc.properties[field] = []);
    acc.properties[field].push(prop);

    return acc;
};

export const propFieldToKey = (prop) => prop.getField();
export const propFilterKey = (prop) => {
    const key = prop.getField();
    const isClear = CLEAR_FIELDS.includes(key);

    if (isClear) {
        return 'clearText';
    }

    const isSigned = SIGNED_FIELDS.includes(key);

    if (isSigned) {
        return 'toSign';
    }

    const isEncrypted = ENCRYPTED_FIELDS.includes(key);
    if ((!isClear && !isSigned) || isEncrypted) {
        return 'toEncryptAndSign';
    }
};

const MAP_ACTION = {
    default: propFieldToKey,
    encryption: propFilterKey
};

const make = (vCards = [], { type = 'default', unicityGroup = false } = {}) => {
    /**
     * Empty maps to store properties as well as new converted groups
     * -> to ensure if we have categories attach to emails we keep them attached.
     * Count of the id of the group to ensure that no conflicts exists between them between contacts.
     * @type {Object}
     */
    const INITIAL_STATE = {
        properties: Object.create(null),
        groupId: 0,
        newGroups: Object.create(null)
    };

    const { properties } = _.reduce(
        vCards,
        (acc, vcard = {}, index) => {
            return _.reduce(extractAll(vcard), propertiesReducer(MAP_ACTION[type], index, unicityGroup), acc);
        },
        INITIAL_STATE
    );

    return properties;
};

export default make;
