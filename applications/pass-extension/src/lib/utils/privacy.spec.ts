import browser from 'proton-pass-extension/__mocks__/webextension-polyfill';

import * as privacy from './privacy';

const setBuildTarget = (value: string) => ((global as any).BUILD_TARGET = value);

describe('Privacy', () => {
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
        test('should return true when controlled by extension and value is false', () => {
            expect(
                privacy.settingControlledAndDisabled({
                    levelOfControl: 'controlled_by_this_extension',
                    value: false,
                })
            ).toBe(true);
        });

        test('should return false when controlled by extension but value is true', () => {
            expect(
                privacy.settingControlledAndDisabled({
                    levelOfControl: 'controlled_by_this_extension',
                    value: true,
                })
            ).toBe(false);
        });

        test('should return false when not controlled by extension', () => {
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
            expect(await privacy.checkBrowserAutofillCapabilities()).toBe(false);
        });

        test('should return `true` when all settings are controlled and disabled', async () => {
            setBuildTarget('chrome');
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());

            const details = { levelOfControl: 'controlled_by_this_extension', value: false };
            (browser.privacy.services.autofillAddressEnabled.get as jest.Mock).mockResolvedValue(details);
            (browser.privacy.services.passwordSavingEnabled.get as jest.Mock).mockResolvedValue(details);

            expect(await privacy.checkBrowserAutofillCapabilities()).toBe(true);
        });

        test('should return `false` when any setting is not controlled or enabled', async () => {
            setBuildTarget('chrome');
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());

            const detailsActive = { levelOfControl: 'controlled_by_this_extension', value: false };
            const detailsInactive = { levelOfControl: 'not_controllable', value: false };
            (browser.privacy.services.autofillAddressEnabled.get as jest.Mock).mockResolvedValue(detailsActive);
            (browser.privacy.services.passwordSavingEnabled.get as jest.Mock).mockResolvedValue(detailsInactive);

            expect(await privacy.checkBrowserAutofillCapabilities()).toBe(false);
        });
    });

    describe('`setBrowserAutofillCapabilities`', () => {
        test('should set all settings and return the input value', async () => {
            setBuildTarget('chrome');
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());

            const result = await privacy.setBrowserAutofillCapabilities(true);
            expect(browser.privacy.services.autofillAddressEnabled.set).toHaveBeenCalledWith({ value: false });
            expect(browser.privacy.services.passwordSavingEnabled.set).toHaveBeenCalledWith({ value: false });
            expect(result).toBe(true);
        });

        test('should handle errors gracefully', async () => {
            setBuildTarget('chrome');
            privacy.BROWSER_AUTOFILL_SETTINGS.push(...privacy.getBrowserAutofillSettings());
            (browser.privacy.services.autofillAddressEnabled.set as jest.Mock).mockRejectedValue(new Error());

            const result = await privacy.setBrowserAutofillCapabilities(false);
            expect(browser.privacy.services.autofillAddressEnabled.set).toHaveBeenCalledWith({ value: true });
            expect(browser.privacy.services.passwordSavingEnabled.set).toHaveBeenCalledWith({ value: true });
            expect(result).toBe(true);
        });
    });
});
