/**
 * Convert Object<Boolean> to bitmap
 * @param {Object<Boolean>} o ex: { announcements: true, features: false, newsletter: false, beta: false }
 * @returns {Number} bitmap
 */
export const toBitMap = (o = {}) => Object.keys(o).reduce((acc, key, index) => acc + (o[key] << index), 0);

/**
 * Define an Object from a bitmap value
 * @param {Number} value bitmap
 * @param {Array<String>} keys ex: ['announcements', 'features', 'newsletter', 'beta']
 * @returns {Object<Boolean>} ex: { announcements: true, features: false, newsletter: false, beta: false }
 */
export const fromBitmap = (value, keys = []) =>
    keys.reduce((acc, key, index) => {
        acc[key] = !!(value & (1 << index));
        return acc;
    }, {});

/**
 * This method creates an object composed of the own and inherited enumerable property paths of object that are not omitted.
 * @param {object} model The source object.
 * @param {Array} properties The property paths to omit.
 * @retuns {Object} Returns the new object.
 */
export const omit = (model, properties = []) => {
    return Object.entries(model)
        .filter(([key]) => !properties.includes(key))
        .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {});
};
