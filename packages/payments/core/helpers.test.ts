import { ADDON_NAMES, PLANS } from './constants';
import { fixPlanIDs, fixPlanName } from './helpers';

describe('helpers', () => {
    describe('fixPlanName', () => {
        it('should convert VPN to VPN2024', () => {
            expect(fixPlanName(PLANS.VPN, 'test')).toBe(PLANS.VPN2024);
        });

        it('should return same plan name for non-VPN plans', () => {
            expect(fixPlanName(PLANS.MAIL, 'test')).toBe(PLANS.MAIL);
            expect(fixPlanName(PLANS.VPN2024, 'test')).toBe(PLANS.VPN2024);
        });

        it('should handle undefined input', () => {
            expect(fixPlanName(undefined, 'test')).toBe(undefined);
        });

        it('should handle null input', () => {
            expect(fixPlanName(null, 'test')).toBe(null);
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
            expect(fixPlanIDs(input, 'test')).toEqual(expected);
        });

        it('should return undefined if input is undefined', () => {
            expect(fixPlanIDs(undefined, 'test')).toBe(undefined);
        });

        it('should return the same object if input does not contain VPN plan', () => {
            const input = {
                [PLANS.MAIL]: 1,
            };
            expect(fixPlanIDs(input, 'test')).toBe(input);
        });

        it('should handle empty plan IDs object', () => {
            expect(fixPlanIDs({}, 'test')).toEqual({});
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
            expect(fixPlanIDs(input, 'test')).toEqual(expected);
        });

        it('should handle errors gracefully', () => {
            // Testing the try-catch block by passing an object that will throw when spread
            const malformedInput = Object.create(null);
            Object.defineProperty(malformedInput, PLANS.VPN, {
                get() {
                    throw new Error('Test error');
                },
            });
            expect(fixPlanIDs(malformedInput as any, 'test')).toBe(malformedInput);
        });
    });
});
