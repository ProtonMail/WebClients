import { addDays, endOfDay } from 'date-fns';
import { vi } from 'vitest';

import * as cookiesModule from '@proton/shared/lib/helpers/cookies';

import type { FeatureFlagToggle } from '../interface';
import saveAllowlistedFlagInCookies, {
    UNLEASH_FLAG_COOKIE_NAME,
    saveStaticExperimentVariants,
} from './UnleashCookiesProvider';

// ------------------------------
// Mocks
// ------------------------------
vi.mock('@proton/shared/lib/helpers/cookies', () => ({
    getCookie: vi.fn(),
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
}));

const localStorageItems = new Map<string, string>();
vi.mock('@proton/shared/lib/helpers/storage', () => ({
    getItem: (key: string) => localStorageItems.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageItems.set(key, value),
}));

// ------------------------------
// Spies
// ------------------------------
const getCookieSpys = () => {
    return {
        getCookie: vi.spyOn(cookiesModule, 'getCookie'),
        setCookie: vi.spyOn(cookiesModule, 'setCookie'),
        deleteCookie: vi.spyOn(cookiesModule, 'deleteCookie'),
    };
};

// ------------------------------
// Helpers
// ------------------------------
const generateFlag = (name: string, variantName: string, flagEnabled?: boolean, variantEnabled?: boolean) => {
    return {
        enabled: flagEnabled ?? true,
        name,
        variant: {
            name: variantName,
            enabled: variantEnabled ?? true,
        },
    } satisfies FeatureFlagToggle;
};

// ------------------------------
// Test suite
// ------------------------------
describe('UnleashCookiesProvider', () => {
    beforeAll(() => {
        Object.defineProperty(globalThis, 'window', {
            value: { location: { hostname: 'www.example.com' } },
            writable: true,
        });
    });

    beforeEach(() => {
        vi.resetAllMocks();
        localStorageItems.clear();
    });

    describe('Whitelisted flag with variant', () => {
        beforeEach(() => {
            const whitelistedFlags = ['ValidFlag'];
            const unleashFlagsList = [generateFlag('ValidFlag', 'VariantA'), generateFlag('InvalidFlag', 'VariantB')];
            saveAllowlistedFlagInCookies(unleashFlagsList, whitelistedFlags);
        });

        it.each([
            ['cookieName', UNLEASH_FLAG_COOKIE_NAME],
            ['cookieValue', 'ValidFlag:VariantA'],
            ['path', '/'],
            ['secure', true],
            ['expirationDate', endOfDay(addDays(new Date(), 30)).toUTCString()],
        ])('%s key should be set to %j', (key, value) => {
            const { setCookie } = getCookieSpys();
            expect(setCookie).toHaveBeenCalledWith(
                expect.objectContaining({
                    [key]: value,
                })
            );
        });
    });

    it('Should not save non whitelisted flag with variant', () => {
        const { setCookie } = getCookieSpys();
        const whitelistedFlags = ['ValidFlag'];
        const unleashFlagsList = [generateFlag('ValidFlag', 'VariantA'), generateFlag('InvalidFlag', 'VariantB')];

        saveAllowlistedFlagInCookies(unleashFlagsList, whitelistedFlags);
        expect(setCookie).toHaveBeenCalledWith(
            expect.objectContaining({
                cookieValue: 'ValidFlag:VariantA',
            })
        );
    });

    it('Should not save disabled flags', () => {
        const { setCookie } = getCookieSpys();
        const whitelistedFlags = ['ValidFlag'];
        const unleashFlagsList = [
            generateFlag('ValidFlag', 'VariantA', false, true),
            generateFlag('InvalidFlag', 'VariantB'),
        ];

        saveAllowlistedFlagInCookies(unleashFlagsList, whitelistedFlags);
        expect(setCookie).not.toHaveBeenCalled();
    });

    it('Should not save enabled flag with disabled variant', () => {
        const { setCookie } = getCookieSpys();
        const whitelistedFlags = ['ValidFlag'];
        const unleashFlagsList = [
            generateFlag('ValidFlag', 'VariantA', true, false),
            generateFlag('InvalidFlag', 'VariantB'),
        ];

        saveAllowlistedFlagInCookies(unleashFlagsList, whitelistedFlags);
        expect(setCookie).not.toHaveBeenCalled();
    });

    describe('Should not save flag or variant with invalid characters', () => {
        const cases = [
            ['coma in flag name', 'Invalid,Flag', 'VariantA'],
            ['colon in flag name', 'Invalid:Flag', 'VariantA'],
            ['space in flag name', 'Invalid Flag', 'VariantA'],
            ['coma in variantName', 'Flag', 'Invalid,Variant'],
            ['colon in variantName', 'Flag', 'Invalid:Variant'],
            ['space in variantName', 'Flag', 'Invalid Variant'],
        ];

        it.each(cases)('%s should not be saved', async (_, flagName, variantName) => {
            const { setCookie } = getCookieSpys();
            const whitelistedFlags = [flagName];
            const unleashFlagsList = [generateFlag(flagName, variantName)];

            saveAllowlistedFlagInCookies(unleashFlagsList, whitelistedFlags);
            expect(setCookie).not.toHaveBeenCalled();
        });
    });

    describe('Features cookie parts', () => {
        it('rebuilds the Unleash part from scratch and keeps the static experiments part', () => {
            const { setCookie } = getCookieSpys();
            localStorageItems.set('features-cookie:unleash', 'RetiredFlag:v5,ValidFlag:VariantB');
            localStorageItems.set('features-cookie:static-experiments', 'PaypalFirst:with');

            saveAllowlistedFlagInCookies([generateFlag('ValidFlag', 'VariantA')], ['ValidFlag']);

            expect(setCookie).toHaveBeenCalledWith(
                expect.objectContaining({ cookieValue: 'ValidFlag:VariantA,PaypalFirst:with' })
            );
        });

        it('rebuilds the static experiments part from scratch and keeps the Unleash part', () => {
            const { setCookie } = getCookieSpys();
            localStorageItems.set('features-cookie:unleash', 'ValidFlag:VariantA');
            localStorageItems.set('features-cookie:static-experiments', 'ChallengeV5:v5');

            saveStaticExperimentVariants(new Map([['PaypalFirst', 'with']]));

            expect(setCookie).toHaveBeenCalledWith(
                expect.objectContaining({ cookieValue: 'ValidFlag:VariantA,PaypalFirst:with' })
            );
        });

        it('drops cookie entries left over from before the parts existed', () => {
            const { getCookie, setCookie } = getCookieSpys();
            getCookie.mockReturnValueOnce('RetiredFlag:v5');

            saveAllowlistedFlagInCookies([generateFlag('ValidFlag', 'VariantA')], ['ValidFlag']);

            expect(setCookie).toHaveBeenCalledWith(expect.objectContaining({ cookieValue: 'ValidFlag:VariantA' }));
        });
    });
});
