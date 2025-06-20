import type { Types } from 'webextension-polyfill';
import type { PrivacyServices } from 'webextension-polyfill/namespaces/privacy_services';

import browser, { type chromeAPI } from '@proton/pass/lib/globals/browser';
import { truthy } from '@proton/pass/utils/fp/predicates';
import noop from '@proton/utils/noop';

export type PrivacyService = keyof (PrivacyServices.Static & typeof chromeAPI.privacy.services);
export type PrivacyServiceKey = keyof PrivacyServices.Static;

export const getBrowserAutofillSettings = (): PrivacyService[] => {
    switch (BUILD_TARGET) {
        case 'chrome':
            return ['autofillAddressEnabled', 'passwordSavingEnabled'];
        case 'firefox':
            return ['passwordSavingEnabled'];
        default:
            return [];
    }
};

export const BROWSER_AUTOFILL_SETTINGS = getBrowserAutofillSettings();
export const AUTOFILL_CONTROLLABLE = BROWSER_AUTOFILL_SETTINGS.length > 0;

export const settingControlledAndDisabled = ({ levelOfControl, value }: Types.SettingGetCallbackDetailsType) =>
    levelOfControl === 'controlled_by_this_extension' && !value;

const checkPrivacyPermission = async (): Promise<boolean> =>
    browser.permissions.contains({ permissions: ['privacy'] }).catch(() => false);

const requestPrivacyPermission = (): Promise<boolean> =>
    browser.permissions.request({ permissions: ['privacy'] }).catch(() => false);

export const checkBrowserAutofillCapabilities = async (pendingBrowserAutofill: boolean): Promise<boolean> => {
    if (!BROWSER_AUTOFILL_SETTINGS.length) return false;
    if (!(await checkPrivacyPermission())) return false;

    const results = await Promise.all(
        (BROWSER_AUTOFILL_SETTINGS as PrivacyServiceKey[]).map(async (key) => {
            try {
                if (pendingBrowserAutofill) await browser.privacy.services[key].set({ value: false }).catch(noop);
                const details = await browser.privacy.services[key].get({});
                return settingControlledAndDisabled(details);
            } catch {
                return false;
            }
        })
    );

    return results.every(truthy);
};

export const setBrowserAutofillCapabilities = async (
    enabled: boolean,
    storePending: (enabled: boolean) => void
): Promise<boolean> => {
    try {
        const accepted = await requestPrivacyPermission();
        if (!accepted) throw new Error('Permission not granted');

        /** privacy may not be immediately available after granting
         * the permission - as such reload the current page */
        if (typeof browser.privacy === 'undefined') {
            if (enabled) storePending(enabled);
            window.location.reload();
            throw new Error('Permission needs reload');
        }

        await Promise.all(
            BROWSER_AUTOFILL_SETTINGS.map((key) =>
                browser.privacy.services[key as PrivacyServiceKey].set({
                    value: !enabled,
                })
            )
        );

        return enabled;
    } catch {
        return !enabled;
    }
};
