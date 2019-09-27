/**
 * Extract host
 * @param {String} url
 * @returns {String} host
 */
export const getHost = (url = '') => {
    const { host = '' } = new URL(url);
    return host;
};

/**
 * Extract hostname
 * @param {String} url
 * @returns {String} hostname
 */
export const getHostname = (url = '') => {
    const { hostname = '' } = new URL(url);
    return hostname;
};
