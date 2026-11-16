import { ADDON_NAMES, PLANS } from '@proton/payments/core/constants';
import type { PlanIDs } from '@proton/payments/core/interface';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';

import { get2FAAuthenticatorText, getLoginsAndNotesText, getSecureSharingText } from '../../../features/pass';
import { getWhatsIncluded } from './included';

describe('getWhatsIncluded', () => {
    it('lists the Pass basic features', () => {
        const included = getWhatsIncluded({
            planIDs: { [PLANS.PASS_BASIC]: 1 },
            plansMap: getTestPlansMap('CHF'),
            freePlan: FREE_PLAN,
            scribeToLumo: false,
            lumoPlans2026: false,
        });

        expect(included.map((item) => item.type === 'text' && item.text)).toEqual([
            getLoginsAndNotesText(),
            '1 device per user',
            '1 vault per user',
            get2FAAuthenticatorText(),
            getSecureSharingText(true),
        ]);
    });
});

describe('getWhatsIncluded with LumoPlans2026', () => {
    const plansMap = getTestPlansMap('USD');

    const getTexts = (planIDs: PlanIDs, lumoPlans2026: boolean) => {
        return getWhatsIncluded({ planIDs, plansMap, freePlan: FREE_PLAN, scribeToLumo: false, lumoPlans2026 }).map(
            (item) => item.text
        );
    };

    const lumoPlusTexts = ['2x Basic usage', 'Extended image generation', 'Maximum Skills and Projects', 'Lumo Code'];

    it('lists everything Lumo Basic includes', () => {
        expect(getTexts({ [PLANS.LUMO_BASIC]: 1 }, true)).toEqual([
            'More usage',
            'More image generation',
            'More Skills, Projects, and scheduled tasks',
            'Lumo Code',
        ]);
    });

    it('lists everything Lumo Plus includes', () => {
        expect(getTexts({ [PLANS.LUMO]: 1 }, true)).toEqual(lumoPlusTexts);
    });

    it('lists everything Lumo Ultra includes', () => {
        expect(getTexts({ [PLANS.LUMO_ULTRA]: 1 }, true)).toEqual([
            '5x Plus usage',
            'Maximum image generation',
            'Maximum Skills and Projects',
            'Lumo Code',
            'API access, with US$50 a month credit',
        ]);
    });

    it('adds the Lumo Plus lines for a B2C Lumo addon', () => {
        const withoutAddon = getTexts({ [PLANS.MAIL]: 1 }, true);

        expect(getTexts({ [PLANS.MAIL]: 1, [ADDON_NAMES.LUMO_MAIL]: 1 }, true)).toEqual([
            ...withoutAddon,
            ...lumoPlusTexts,
        ]);
    });

    it('adds the current Lumo lines and the API lines for a B2B Lumo addon', () => {
        const withoutAddon = getTexts({ [PLANS.MAIL_PRO]: 1 }, true);

        expect(getTexts({ [PLANS.MAIL_PRO]: 1, [ADDON_NAMES.LUMO_MAIL_PRO]: 1 }, true)).toEqual([
            ...withoutAddon,
            'Access to advanced AI models',
            'Unlimited daily chats',
            'Full chat history with search',
            'Large file upload support',
            'API access, with US$5 a month credit per user',
        ]);
    });

    it('keeps the current Lumo Plus benefits when the flag is off', () => {
        expect(getTexts({ [PLANS.LUMO]: 1 }, false)).toEqual([
            'Access to advanced AI models',
            'Unlimited daily chats',
            'Full chat history with search',
            'Large file upload support',
        ]);
    });
});
