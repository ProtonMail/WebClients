import { createLocation } from 'history';

import { PLANS } from '@proton/payments/core/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import { getSignupParameters } from './signupParameters';

const getPreselectedPlan = ({ toApp, visionarySignupEnabled }: { toApp: APP_NAMES; visionarySignupEnabled: boolean }) =>
    getSignupParameters({
        toApp,
        visionarySignupEnabled,
        location: createLocation(`/signup?plan=${PLANS.VISIONARY}`),
    }).preSelectedPlan;

describe('getSignupParameters', () => {
    describe.each([APPS.PROTONWALLET, APPS.PROTONMAIL, APPS.PROTONDRIVE])(
        'visionary plan parameter for %s',
        (toApp) => {
            it('drops the plan when visionary signup is disabled', () => {
                expect(getPreselectedPlan({ toApp, visionarySignupEnabled: false })).toBeUndefined();
            });

            it('keeps the plan when visionary signup is enabled', () => {
                expect(getPreselectedPlan({ toApp, visionarySignupEnabled: true })).toBe(PLANS.VISIONARY);
            });
        }
    );
});
