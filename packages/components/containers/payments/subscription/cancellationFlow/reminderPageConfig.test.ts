import { PLANS, getPlan } from '@proton/payments';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import { APPS } from '@proton/shared/lib/constants';

import { user as mockUser, subscriptionBundlePro } from '../__mocks__/data';
import { getReminderPageConfig } from './reminderPageConfig';

jest.mock('@proton/payments', () => ({
    __esModule: true,
    ...jest.requireActual('@proton/payments'),
    getPlan: jest.fn(),
}));

const setMockPlan = (planName: PLANS) => {
    (getPlan as jest.Mock).mockReturnValue({
        MaxAddresses: 5,
        MaxCalendars: 1,
        MaxDomains: 1,
        MaxMembers: 1,
        MaxSpace: 536870912000,
        Name: planName,
    });
};

const user = {
    ...mockUser,
    canPay: true,
    hasNonDelinquentScope: true,
    hasPaidDrive: false,
    hasPaidMail: true,
    hasPaidPass: false,
    hasPaidVpn: false,
    isAdmin: false,
    isDelinquent: false,
    isFree: false,
    isMember: true,
    isPaid: true,
    isPrivate: false,
    isSelf: true,
    hasPassLifetime: false,
    accessType: AccessType.Self,
};

describe('getReminderPageConfig', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test.each([
        [PLANS.MAIL, undefined],
        [PLANS.BUNDLE, PLANS.MAIL],
        [PLANS.FAMILY, undefined],
        [PLANS.DUO, PLANS.BUNDLE],
        [PLANS.VISIONARY, PLANS.FAMILY],
        [PLANS.DRIVE, undefined],
        [PLANS.MAIL_PRO, undefined],
        [PLANS.MAIL_BUSINESS, PLANS.MAIL_PRO],
        [PLANS.BUNDLE_PRO_2024, PLANS.MAIL_BUSINESS],
        [PLANS.BUNDLE_PRO, PLANS.MAIL_BUSINESS],
    ])(
        'given app is Mail and plan name is %s, should return the correct upsell plan, if any',
        (planName: PLANS, upsellPlanName: PLANS | undefined) => {
            setMockPlan(planName);
            const config = getReminderPageConfig({ app: APPS.PROTONMAIL, subscription: subscriptionBundlePro, user });

            expect(config?.upsellPlan).toEqual(upsellPlanName);
        }
    );
});
