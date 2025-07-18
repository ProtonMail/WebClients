import browser, { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';

import noop from '@proton/utils/noop';

import * as privacy from './privacy';

const setBuildTarget = (value: string) => ((global as any).BUILD_TARGET = value);

describe('Privacy', () => {
    beforeEach(() => {
        setBuildTarget('chrome');
        clearBrowserMocks();
    });

    describe('`BROWSER_AUTOFILL_SETTINGS`', () => {
        test('should return correct settings for chrome', () => {
            setBuildTarget('chrome');
            expect(privacy.getBrowserAutofillSettings()).toEqual(['autofillAddressEnabled', 'passwordSavingEnabled']);
        });

        test('should return correct settings for firefox', () => {
            setBuildTarget('firefox');
            expect(privacy.getBrowserAutofillSettings()).toEqual(['passwordSavingEnabled']);
        });

        test('should return empty array for other target', () => {
            setBuildTarget('safari');
            expect(privacy.getBrowserAutofillSettings()).toEqual([]);
        });
    });

    describe('`settingControlledAndDisabled`', () => {
        test('should return `true` when controlled by extension and value is false', () => {
            expect(
                privacy.settingControlledAndDisabled({
                    levelOfControl: 'controlled_by_this_extension',
                    value: false,
                })
            ).toBe(true);
        });

        test('should return `false` when controlled by extension but value is true', () => {
            expect(
                privacy.settingControlledAndDisabled({
                    levelOfControl: 'controlled_by_this_extension',
                    value: true,
                })
            ).toBe(false);
        });

        test('should return `false` when not controlled by extension', () => {
            expect(
                privacy.settingControlledAndDisabled({
                    levelOfControl: 'not_controllable',
                    value: false,
                })
            ).toBe(false);
        });
    });

    describe('`checkBrowserAutofillCapabilities`', () => {
        afterEach(() => (privacy.BROWSER_AUTOFILL_SETTINGS.length = 0));

        test('should return `false` when if `BROWSER_AUTOFILL_SETTINGS` is empty', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.length = 0;
            expect(await privacy.checkBrowserAutofillCapabilities(false)).toBe(false);
        });

        test('should return `false` if "privacy" permission not granted', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());
            browser.permissions.contains.mockResolvedValueOnce(false);

            expect(await privacy.checkBrowserAutofillCapabilities(false)).toBe(false);
        });

        test('should return `true` when all settings are controlled and disabled', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());

            const details = { levelOfControl: 'controlled_by_this_extension', value: false };
            browser.privacy.services.autofillAddressEnabled.get.mockResolvedValue(details);
            browser.privacy.services.passwordSavingEnabled.get.mockResolvedValue(details);

            expect(await privacy.checkBrowserAutofillCapabilities(false)).toBe(true);
        });

        test('should return `false` when any setting is not controlled or enabled', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());

            const detailsActive = { levelOfControl: 'controlled_by_this_extension', value: false };
            const detailsInactive = { levelOfControl: 'not_controllable', value: false };
            browser.privacy.services.autofillAddressEnabled.get.mockResolvedValue(detailsActive);
            browser.privacy.services.passwordSavingEnabled.get.mockResolvedValue(detailsInactive);

            expect(await privacy.checkBrowserAutofillCapabilities(false)).toBe(false);
        });

        test('shoud set browser settings if pending value is `true`', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());
            await privacy.checkBrowserAutofillCapabilities(true);

            expect(browser.privacy.services.autofillAddressEnabled.set).toHaveBeenCalledWith({ value: false });
            expect(browser.privacy.services.passwordSavingEnabled.set).toHaveBeenCalledWith({ value: false });
        });
    });

    describe('`setBrowserAutofillCapabilities`', () => {
        /** Keep a reference for tests mocking `undefined`
         * browser.privacy API after granting permission */
        const privacyAPI = browser.privacy;
        const reload = jest.fn();

        beforeEach(() => {
            jest.spyOn(window, 'location', 'get').mockImplementation(() => ({ reload }) as unknown as Location);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        test('should set all settings and return the input value', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());

            const result = await privacy.setBrowserAutofillCapabilities(true, noop);
            expect(browser.privacy.services.autofillAddressEnabled.set).toHaveBeenCalledWith({ value: false });
            expect(browser.privacy.services.passwordSavingEnabled.set).toHaveBeenCalledWith({ value: false });
            expect(result).toBe(true);
        });

        test('should set settings after granting permission', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());

            const result = await privacy.setBrowserAutofillCapabilities(true, noop);
            expect(browser.privacy.services.autofillAddressEnabled.set).toHaveBeenCalledWith({ value: false });
            expect(browser.privacy.services.passwordSavingEnabled.set).toHaveBeenCalledWith({ value: false });
            expect(result).toBe(true);
        });

        test('should early return if "privacy" permission not granted and user rejects', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());
            browser.permissions.request.mockResolvedValueOnce(false);

            const result = await privacy.setBrowserAutofillCapabilities(true, noop);

            expect(browser.privacy.services.autofillAddressEnabled.set).not.toHaveBeenCalled();
            expect(browser.privacy.services.passwordSavingEnabled.set).not.toHaveBeenCalledWith();
            expect(result).toBe(false);
        });

        test('should reload window if "privacy" permission not granted, user accepts but API unavailable', async () => {
            delete (browser as any).privacy; /* mock API not available */

            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());
            browser.permissions.contains.mockResolvedValueOnce(false);
            browser.permissions.request.mockResolvedValueOnce(true);
            const setPending = jest.fn();
            const result = await privacy.setBrowserAutofillCapabilities(true, setPending);

            expect(result).toBe(false);
            expect(reload).toHaveBeenCalled();
            expect(setPending).toHaveBeenCalledWith(true);

            browser.privacy = privacyAPI;
        });

        test('should handle errors gracefully', async () => {
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());
            browser.privacy.services.autofillAddressEnabled.set.mockRejectedValue(new Error());

            const result = await privacy.setBrowserAutofillCapabilities(false, noop);
            expect(browser.privacy.services.autofillAddressEnabled.set).toHaveBeenCalledWith({ value: true });
            expect(browser.privacy.services.passwordSavingEnabled.set).toHaveBeenCalledWith({ value: true });
            expect(result).toBe(true);
        });
    });
});
