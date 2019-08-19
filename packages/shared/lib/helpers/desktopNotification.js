import Push from 'push.js';

import { noop } from './function';

/**
 * To find out whether or not Push has permission to show notifications
 * @returns {Boolean}
 */
export const isEnabled = Push.Permission.has;

/**
 * Clear all open notifications
 */
export const clear = Push.clear();

/**
 * Request notification permission
 * @param {Function} onGranted
 * @param {Function} onDenied
 */
export const request = (onGranted = noop, onDenied = noop) => {
    try {
        Push.Permission.request(onGranted, onDenied);
    } catch (err) {
        /**
         * Hotfix to fix requesting the permission on non-promisified requests.
         * TypeError: undefined is not an object (evaluating 'this._win.Notification.requestPermission().then')
         * https://github.com/Nickersoft/push.js/issues/117
         */
    }
};

/**
 * Create a desktop notification
 * @param {String} title
 * @param {Object} params https://pushjs.org/docs/options
 * @returns {Promise(notification)} notification.close();
 */
export const create = async (title = '', params = {}) => {
    if (isEnabled()) {
        return;
    }
    return Push.create(title, params);
};
