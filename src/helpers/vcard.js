import _ from 'lodash';

import { normalizeEmail } from './string';

export const getGroup = (emailList, email) => {
    const normalEmail = normalizeEmail(email);
    const prop = _.find(emailList, (prop) => normalizeEmail(prop.valueOf()) === normalEmail);
    if (!prop) {
        return;
    }
    return prop.getGroup();
};

export const groupMatcher = (group) => (prop) => {
    return typeof prop.getGroup() === 'undefined' || prop.getGroup().toLowerCase() === group.toLowerCase();
};

/**
 * Order properties by preference parameter
 * @param {Array} properties
 * @return {Array}
 */
export function orderByPref(properties = []) {
    return _.sortBy(properties, (property) => {
        const { pref = 0 } = property.getParams() || {};
        return pref;
    });
}

export const uniqGroups = (list) => {
    return _.reduce(
        list,
        (acc, property) => {
            const group = property.getGroup();
            if (acc.indexOf(group) === -1) {
                acc.push(group);
            }
            return acc;
        },
        []
    );
};
