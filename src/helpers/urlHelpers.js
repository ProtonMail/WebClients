/* eslint-disable import/prefer-default-export */
/**
 * Get the current sorting state from the URL (?sort=asc|desc)
 * @param {String} stateParams
 * @return {Object}
 */
export const currentSorting = (stateParams) => {
    const prefix = (stateParams.sort || '').startsWith('-') ? '-' : '';
    const sort = (stateParams.sort || '').substr(prefix.length);
    const order = prefix === '' ? 'asc' : 'desc';

    return { order, sort };
};
