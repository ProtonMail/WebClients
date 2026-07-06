import { ADDON_NAMES, PLANS } from '@proton/payments/core/constants';

import { showMeetAddonCustomizer } from './showMeetAddonCustomizer';

describe('showMeetAddonCustomizer', () => {
    describe('selected plan support for meet addon', () => {
        it('should return false if selected plan does not support meet addon', () => {
            expect(
                showMeetAddonCustomizer({
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.MEET]: 1,
                    },
                })
            ).toBe(false);
        });

        it('should return false if no plan is selected', () => {
            expect(
                showMeetAddonCustomizer({
                    couponConfig: undefined,
                    planIDs: {},
                })
            ).toBe(false);
        });

        it('should return true if selected plan supports meet addon', () => {
            expect(
                showMeetAddonCustomizer({
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.BUNDLE]: 1,
                    },
                })
            ).toBe(true);
        });
    });

    describe('Custom overrides', () => {
        it('should hide meet addon customizer if hideMeetAddonBanner is true', () => {
            expect(
                showMeetAddonCustomizer({
                    couponConfig: { hideMeetAddonBanner: true, coupons: [], hidden: false },
                    planIDs: {
                        [PLANS.BUNDLE]: 1,
                    },
                })
            ).toBe(false);
        });

        it('should display meet addon banner if it is already specified in planIDs', () => {
            expect(
                showMeetAddonCustomizer({
                    couponConfig: undefined,
                    planIDs: {
                        [PLANS.MAIL]: 1,
                        [ADDON_NAMES.MEET_MAIL]: 1,
                    },
                })
            ).toBe(true);
        });

        it('should display meet addon banner even if hideMeetAddonBanner is true when the addon is already in planIDs', () => {
            expect(
                showMeetAddonCustomizer({
                    couponConfig: { hideMeetAddonBanner: true, coupons: [], hidden: false },
                    planIDs: {
                        [PLANS.MAIL]: 1,
                        [ADDON_NAMES.MEET_MAIL]: 1,
                    },
                })
            ).toBe(true);
        });
    });
});
