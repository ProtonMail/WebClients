/**
 * Extract host
 * @param {String} url
 * @returns {String}
 */
export const getHost = (url = '') => {
    const link = document.createElement('a');
    link.href = url;
    return link.host;
};
