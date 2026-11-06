import { ADDON_NAMES, PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import { getAssistantKillSwitch } from './assistantKillSwitch';

describe('getAssistantKillSwitch', () => {
    it('shows the assistant section when a subscription has a Scribe addon', () => {
        const mailProWithScribe = buildSubscription({ [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1 });

        expect(getAssistantKillSwitch({ isInAllowedApps: true, subscriptions: [mailProWithScribe] })).toBe(false);
    });

    it('shows the assistant section when the Scribe addon is on a secondary subscription', () => {
        const subscriptions = [
            buildSubscription(PLANS.VPN2024),
            buildSubscription({ [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1 }),
        ];

        expect(getAssistantKillSwitch({ isInAllowedApps: true, subscriptions })).toBe(false);
    });

    it.each([PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY, PLANS.LUMO])(
        'hides the assistant section for %s, which grants Scribe without the addon',
        (plan) => {
            expect(getAssistantKillSwitch({ isInAllowedApps: true, subscriptions: [buildSubscription(plan)] })).toBe(
                true
            );
        }
    );

    it('hides the assistant section for a Lumo addon', () => {
        const mailProWithLumo = buildSubscription({ [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.LUMO_MAIL_PRO]: 1 });

        expect(getAssistantKillSwitch({ isInAllowedApps: true, subscriptions: [mailProWithLumo] })).toBe(true);
    });

    it('hides the assistant section for free users', () => {
        expect(getAssistantKillSwitch({ isInAllowedApps: true, subscriptions: [] })).toBe(true);
    });

    it('hides the assistant section outside the allowed apps even with a Scribe addon', () => {
        const mailProWithScribe = buildSubscription({ [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO]: 1 });

        expect(getAssistantKillSwitch({ isInAllowedApps: false, subscriptions: [mailProWithScribe] })).toBe(true);
    });
});
