import Push from 'push.js';

import { noop } from './function';

export enum Status {
    DENIED = 'denied',
    DEFAULT = 'default',
    GRANTED = 'granted'
}

export const getStatus = (): Status => {
    const permission = Push.Permission.get();
    switch (permission) {
        case Status.DENIED:
            return Status.DENIED;
        case Status.GRANTED:
            return Status.GRANTED;
        default:
            return Status.DEFAULT;
    }
};

export const isEnabled = (): boolean => Push.Permission.has();

export const clear = () => Push.clear();

export const request = (onGranted: () => void = noop, onDenied: () => void = noop) => {
    try {
        Push.Permission.request(onGranted, onDenied);
    } catch (err) {
        onDenied();
        /**
         * Hotfix to fix requesting the permission on non-promisified requests.
         * TypeError: undefined is not an object (evaluating 'this._win.Notification.requestPermission().then')
         * https://github.com/Nickersoft/push.js/issues/117
         */
    }
};

/**
 * Create a desktop notification
 * @param title
 * @param params https://pushjs.org/docs/options
 */
export const create = async (title = '', params = {}) => {
    if (!isEnabled()) {
        return;
    }
    return Push.create(title, params);
};
