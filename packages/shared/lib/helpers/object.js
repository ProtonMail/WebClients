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
