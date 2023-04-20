/**
 * We create a proxy around the `chrome` or `browser` global object to hide them
 * from the devtools of our extension. This is done to prevent developers from
 * accidentally or intentionally modifying the extension's messaging system, which
 * could cause unexpected behavior or security issues. By hiding these globals,
 * we ensure that the extension's messaging system is only accessed through the
 * provided APIs, and not directly through the devtools console or other means.
 */
import browser from 'webextension-polyfill';

import { logger } from '../utils/logger';

const self = globalThis as any;

const HIDDEN_GLOBALS = {
    chrome: self.chrome,
    browser: self.browser,
};

export default (() => {
    const polyfill = browser;

    Object.entries(HIDDEN_GLOBALS)
        .filter(([, value]) => value)
        .forEach(
            ([key, value]) =>
                ((globalThis as any)[key] = new Proxy(value, {
                    get(target, prop, receiver) {
                        if (process.env.NODE_ENV !== 'development') {
                            return logger.error(`[Extension::Error] extension API is protected`);
                        }

                        return Reflect.get(target, prop, receiver);
                    },
                    set() {
                        logger.error(`[Extension::Error] extension API is read-only`);
                        return false;
                    },
                }))
        );

    return polyfill;
})();

export const chromeAPI = HIDDEN_GLOBALS.chrome as typeof chrome;
