import { isDevOrBlackHost } from '@proton/shared/lib/env';
import { getItem } from '@proton/shared/lib/helpers/storage';

/**
 * Set this key to the string `'true'` to keep the toolbar off a dev or black host — in devtools to
 * silence it locally, or from a Playwright init script so it stays out of visual snapshots.
 *
 * Any other value, including a missing one, leaves the toolbar enabled, so that an unrelated
 * `'false'` or `'0'` lying around in storage cannot read as "disabled".
 */
export const DISABLE_UNLEASH_TOOLBAR_KEY = 'disable-unleash-toolbar';

const isWebDriverControlled = () => navigator.webdriver === true;

export const isUnleashToolbarEnabled = () =>
    typeof window !== 'undefined' &&
    !isWebDriverControlled() &&
    getItem(DISABLE_UNLEASH_TOOLBAR_KEY) !== 'true' &&
    isDevOrBlackHost(window.location.host);
