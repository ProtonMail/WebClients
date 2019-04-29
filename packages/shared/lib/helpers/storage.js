/**
 * Wrap localStorage get item to not break the process.
 * @param {String} key
 * @param {String} [defaultValue]
 * @returns {*}
 */
export const getItem = (key, defaultValue) => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.error(e);
        return defaultValue;
    }
};

/**
 * Wrap localStorage set item to not break the process.
 * @param {String} key
 * @param {*} value
 * @returns {*}
 */
export const setItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.error(e);
    }
};

/**
 * Wrap localStorage remove item to not break the process.
 * @param {String} key
 * @returns {*}
 */
export const removeItem = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(e);
    }
};

/**
 * Test localStorage support
 * @param {String} key optional
 * @returns {Boolean}
 */
export const hasSupport = (key = 'test') => {
    try {
        localStorage.setItem(key, key);
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
};
