/* We create a proxy around the `chrome` or `browser` global object to hide them
 * from the devtools of our extension. This is done to prevent developers from
 * accidentally or intentionally modifying the extension's messaging system, which
 * could cause unexpected behavior or security issues. By hiding these globals,
 * we ensure that the extension's messaging system is only accessed through the
 * provided APIs, and not directly through the devtools console or other means */
import browser from 'webextension-polyfill';

import { logger } from '../utils/logger';

const self = globalThis as any;

const HIDDEN_GLOBALS = {
    chrome: self.chrome,
    browser: self.browser,
};

/* To ensure that Sentry's internal checks involving the browser
 * APIs don't interfere with the initialization of our apps, we
 * wrap the proxy initialization in a setTimeout function, which
 * delays the initialization until the next tick after our apps load.
 * ⚠️ Make sure Sentry is always initialized on app boot. */
export default (() => {
    const polyfill = browser;

    setTimeout(
        () =>
            !self.__DISABLE_BROWSER_TRAP__ &&
            Object.entries(HIDDEN_GLOBALS)
                .filter(([, value]) => value)
                .forEach(([key, value]) => {
                    self[key] = new Proxy(value, {
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
                    });
                }),
        0
    );

    return polyfill;
})();

export const chromeAPI = HIDDEN_GLOBALS.chrome as typeof chrome;
