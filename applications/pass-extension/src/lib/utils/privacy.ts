import type { Types } from 'webextension-polyfill';
import type { PrivacyServices } from 'webextension-polyfill/namespaces/privacy_services';

import browser, { type chromeAPI } from '@proton/pass/lib/globals/browser';
import { truthy } from '@proton/pass/utils/fp/predicates';

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

export const checkBrowserAutofillCapabilities = async (): Promise<boolean> => {
    if (!BROWSER_AUTOFILL_SETTINGS.length) return false;

    const results = await Promise.all(
        BROWSER_AUTOFILL_SETTINGS.map(async (key) => {
            try {
                const details = await browser.privacy.services[key as PrivacyServiceKey].get({});
                return settingControlledAndDisabled(details);
            } catch {
                return false;
            }
        })
    );

    return results.every(truthy);
};

export const setBrowserAutofillCapabilities = async (enabled: boolean): Promise<boolean> => {
    try {
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
