import browser from '@proton/pass/lib/globals/browser';
import type { ClientEndpoint } from '@proton/pass/types/worker/runtime';

const CONTENT_SCRIPT_ENDPOINTS: ClientEndpoint[] = ['contentscript', 'dropdown', 'notification'];

/** Checks if the browser tabs API is available for the given endpoint:
 * - When browser.tabs is undefined (e.g., in iframes or restricted environments)
 * - In Safari content scripts, dropdown, and notification endpoints due to platform limitations
 * - In Firefox content scripts which have limited tabs API support */
export const assertTabsAPIAvailable = (endpoint: ClientEndpoint) => {
    if (browser.tabs === undefined) return false;
    if (BUILD_TARGET === 'safari' && CONTENT_SCRIPT_ENDPOINTS.includes(endpoint)) return false;
    return true;
};
