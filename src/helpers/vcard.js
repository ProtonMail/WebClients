import _ from 'lodash';

import { normalizeEmail } from './string';

export const getGroup = (emailList, email) => {
    const prop = _.find(emailList, (prop) => normalizeEmail(prop.valueOf()) === email);
    if (!prop) {
        return;
    }
    return prop.getGroup();
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
        properties,
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
