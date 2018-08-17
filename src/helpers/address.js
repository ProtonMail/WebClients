/**
 * Check if the address is fallback (Can't receive but has keys)
 * @param {Object} address
 * @param {Array} keys
 * @return {Boolean}
 */
export const isFallbackAddress = ({ Receive = 0 } = {}, keys = []) => !Receive && keys.length;

/**
 * Is own address
 * @param {Object} address
 * @param {Array} keys
 * @return {Boolean}
 */
export const isOwnAddress = (address, keys = []) => address && !isFallbackAddress(address, keys);
