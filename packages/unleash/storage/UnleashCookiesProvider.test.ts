import type { FeatureFlagToggle } from '@proton/pass/types/api/features';

import saveWhitelistedFlagInCookies from './UnleashCookiesProvider';

jest.mock('@proton/shared/lib/helpers/cookies', () => ({
    getCookie: jest.fn(),
    setCookie: jest.fn(),
}));

const { setCookie, getCookie } = require('@proton/shared/lib/helpers/cookies');

const expectedValue = 'NewOnboardingExperiment:[A]';
const whitelisteFlag = {
    name: 'NewOnboardingExperiment',
    variant: {
        name: 'VariantA',
        enabled: true,
        payload: {
            type: 'string',
            value: 'A',
        },
    },
};
const otherFlag = {
    name: 'OtherFeature',
    variant: {
        name: 'Variant',
        enabled: false,
        payload: {
            type: 'string',
            value: 'Something',
        },
    },
};

describe('UnleashCookiesProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should save whitelisted flags in cookies with variant', () => {
        const data = [whitelisteFlag] satisfies FeatureFlagToggle[];

        saveWhitelistedFlagInCookies(data);
        expect(setCookie).toHaveBeenCalledWith({
            cookieName: 'unleashFlags',
            cookieValue: expectedValue,
            path: '/',
            secure: true,
            expirationDate: 'max',
        });
    });

    it('should save whitelisted flags in cookies without variant', () => {
        const data = [
            { ...whitelisteFlag, variant: { ...whitelisteFlag.variant, payload: null } },
            otherFlag,
        ] satisfies FeatureFlagToggle[];

        saveWhitelistedFlagInCookies(data);
        expect(setCookie).toHaveBeenCalledWith({
            cookieName: 'unleashFlags',
            cookieValue: 'NewOnboardingExperiment',
            path: '/',
            secure: true,
            expirationDate: 'max',
        });
    });

    it('should not save non whitelisted flags in cookies', () => {
        const data = [whitelisteFlag, otherFlag] satisfies FeatureFlagToggle[];

        saveWhitelistedFlagInCookies(data);
        expect(setCookie).toHaveBeenCalledWith({
            cookieName: 'unleashFlags',
            cookieValue: expectedValue,
            path: '/',
            secure: true,
            expirationDate: 'max',
        });
    });

    it('should not save disabled variants in cookies', () => {
        const data = [
            { ...whitelisteFlag, variant: { ...whitelisteFlag.variant, enabled: false } },
            otherFlag,
        ] satisfies FeatureFlagToggle[];

        saveWhitelistedFlagInCookies(data);
        expect(getCookie('unleashFlags')).toBe(undefined);
    });

    it('should not save flags with no payload in cookies', () => {
        const data = [
            { ...whitelisteFlag, variant: { ...whitelisteFlag.variant, payload: null } },
            otherFlag,
        ] satisfies FeatureFlagToggle[];

        saveWhitelistedFlagInCookies(data);
        expect(getCookie('unleashFlags')).toBe(undefined);
    });

    it('should not save flags with no value in cookies', () => {
        const data = [otherFlag] satisfies FeatureFlagToggle[];

        saveWhitelistedFlagInCookies(data);
        expect(getCookie('unleashFlags')).toBe(undefined);
    });
});
