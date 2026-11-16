import { render } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import { getLumoConfiguration } from './configuration';

const getConfiguration = (audience: Audience.B2B | Audience.B2C, isLumoPlans2026Enabled: boolean) => {
    return getLumoConfiguration({
        plansMap: getTestPlansMap('USD'),
        freePlan: FREE_PLAN,
        audience,
        planParameters: undefined,
        isNewB2BPlanEnabled: true,
        isLumoPlans2026Enabled,
    });
};

const getCardLines = (audience: Audience.B2B | Audience.B2C, plan: PLANS, isLumoPlans2026Enabled = true) => {
    const card = getConfiguration(audience, isLumoPlans2026Enabled).planCards[audience].find(
        (card) => card.plan === plan
    );
    const { container } = render(<>{card?.subsection}</>);

    return Array.from(container.querySelectorAll('p, li')).map((element) => element.textContent?.trim());
};

const currentLumoProfessionalLines = [
    'Zero-access encryption',
    'Unlimited daily chats',
    'Web search access',
    'Full chat history with search',
    'Upload and query multiple large files',
    'Access to advanced AI models',
    'Data never used for AI training',
    'Compliance with data protection regulations',
];

describe('getLumoConfiguration', () => {
    describe('LumoPlans2026 on', () => {
        it('shows Free, Lumo Basic, Lumo Plus and Lumo Ultra to individuals, with Lumo Plus as the best offer', () => {
            const cards = getConfiguration(Audience.B2C, true).planCards[Audience.B2C];

            expect(cards.map(({ plan, type }) => [plan, type])).toEqual([
                [PLANS.FREE, 'standard'],
                [PLANS.LUMO_BASIC, 'standard'],
                [PLANS.LUMO, 'best'],
                [PLANS.LUMO_ULTRA, 'standard'],
            ]);
        });

        it('shows Lumo Professional and Workspace Premium to businesses, without Visionary', () => {
            const plans = getConfiguration(Audience.B2B, true).planCards[Audience.B2B].map(({ plan }) => plan);

            expect(plans).toEqual([PLANS.LUMO_BUSINESS, PLANS.BUNDLE_BIZ_2025, undefined]);
        });

        it('lists what the free plan has on the free card', () => {
            expect(getCardLines(Audience.B2C, PLANS.FREE)).toEqual([
                'Includes:',
                'Limited messages and chat history',
                'Limited Skills, Projects, and scheduled tasks',
                'Limited image generation',
            ]);
        });

        it('lists what Lumo Basic adds to the free plan', () => {
            expect(getCardLines(Audience.B2C, PLANS.LUMO_BASIC)).toEqual([
                'Everything in Free, and:',
                'More usage',
                'More image generation',
                'More Skills, Projects, and scheduled tasks',
                'Lumo Code',
            ]);
        });

        it('lists what Lumo Plus adds to Lumo Basic', () => {
            expect(getCardLines(Audience.B2C, PLANS.LUMO)).toEqual([
                'Everything in Basic, and:',
                '2x Basic usage',
                'Extended image generation',
                'Maximum Skills and Projects',
            ]);
        });

        it('lists what Lumo Ultra adds to Lumo Plus', () => {
            expect(getCardLines(Audience.B2C, PLANS.LUMO_ULTRA)).toEqual([
                'Everything in Plus, and:',
                '5x Plus usage',
                'Maximum image generation',
                'API access, with US$50 a month credit',
            ]);
        });

        it('adds API access to the current Lumo Professional card', () => {
            expect(getCardLines(Audience.B2B, PLANS.LUMO_BUSINESS)).toEqual([
                ...currentLumoProfessionalLines,
                'API access, with US$5 a month credit per user',
            ]);
        });

        it('accepts Lumo Basic and Lumo Ultra as the default plan', () => {
            const getDefaults = (defaultPlan: PLANS) => {
                return getLumoConfiguration({
                    defaultPlan,
                    freePlan: FREE_PLAN,
                    audience: Audience.B2C,
                    planParameters: undefined,
                    isNewB2BPlanEnabled: true,
                    isLumoPlans2026Enabled: true,
                }).defaults;
            };

            expect(getDefaults(PLANS.LUMO_BASIC).plan).toBe(PLANS.LUMO_BASIC);
            expect(getDefaults(PLANS.LUMO_ULTRA).plan).toBe(PLANS.LUMO_ULTRA);
        });
    });

    describe('LumoPlans2026 off', () => {
        it('keeps the Free and Lumo Plus cards for individuals', () => {
            const cards = getConfiguration(Audience.B2C, false).planCards[Audience.B2C];

            expect(cards.map(({ plan, type }) => [plan, type])).toEqual([
                [PLANS.FREE, 'standard'],
                [PLANS.LUMO, 'best'],
            ]);
        });

        it('keeps the current Lumo Professional card', () => {
            expect(getCardLines(Audience.B2B, PLANS.LUMO_BUSINESS, false)).toEqual(currentLumoProfessionalLines);
        });

        it('falls back to Lumo Plus when Lumo Basic is the default plan', () => {
            const { defaults } = getLumoConfiguration({
                defaultPlan: PLANS.LUMO_BASIC,
                freePlan: FREE_PLAN,
                audience: Audience.B2C,
                planParameters: undefined,
                isNewB2BPlanEnabled: true,
                isLumoPlans2026Enabled: false,
            });

            expect(defaults.plan).toBe(PLANS.LUMO);
        });
    });
});
