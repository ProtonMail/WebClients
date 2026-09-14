import { ADDON_NAMES, PLANS } from './constants';
import { fixPlanIDs } from './helpers';
import { correctDeprecatedPlanName } from './plan/helpers';

describe('helpers', () => {
    describe('correctDeprecatedPlanName', () => {
        it('should convert VPN to VPN2024', () => {
            expect(correctDeprecatedPlanName(PLANS.VPN)).toBe(PLANS.VPN2024);
        });

        it('should return same plan name for non-VPN plans', () => {
            expect(correctDeprecatedPlanName(PLANS.MAIL)).toBe(PLANS.MAIL);
            expect(correctDeprecatedPlanName(PLANS.VPN2024)).toBe(PLANS.VPN2024);
        });

        it('should handle undefined input', () => {
            expect(correctDeprecatedPlanName(undefined)).toBe(undefined);
        });

        it('should handle null input', () => {
            expect(correctDeprecatedPlanName(null)).toBe(null);
        });
    });

    describe('fixPlanIDs', () => {
        it('should convert VPN to VPN2024 in plan IDs', () => {
            const input = {
                [PLANS.VPN]: 1,
            };
            const expected = {
                [PLANS.VPN2024]: 1,
            };
            expect(fixPlanIDs(input)).toEqual(expected);
        });

        it('should return undefined if input is undefined', () => {
            expect(fixPlanIDs(undefined)).toBe(undefined);
        });

        it('should return the same object if input does not contain VPN plan', () => {
            const input = {
                [PLANS.MAIL]: 1,
            };
            expect(fixPlanIDs(input)).toBe(input);
        });

        it('should handle empty plan IDs object', () => {
            expect(fixPlanIDs({})).toEqual({});
        });

        it('should preserve other plan IDs', () => {
            const input = {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
            };
            const expected = {
                [PLANS.MAIL_PRO]: 1,
                [ADDON_NAMES.MEMBER_MAIL_PRO]: 2,
            };
            expect(fixPlanIDs(input)).toEqual(expected);
        });

        it('should handle errors gracefully', () => {
            // Testing the try-catch block by passing an object that will throw when spread
            const malformedInput = Object.create(null);
            Object.defineProperty(malformedInput, PLANS.VPN, {
                get() {
                    throw new Error('Test error');
                },
            });
            expect(fixPlanIDs(malformedInput as any)).toBe(malformedInput);
        });
    });
});
