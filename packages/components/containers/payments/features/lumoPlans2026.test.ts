import { PLANS } from '@proton/payments/core/constants';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getTestPlansMap } from '@proton/payments/testing/data-plans';
import type { PlansMap } from '@proton/shared/lib/payments/plan/interface';

import type { PlanCardFeatureDefinition } from './interface';
import { getLumoFree2026Features } from './lumo';
import { getShortPlan } from './plan';

const mockIsEnabled = vi.fn();
vi.mock('@proton/unleash/standaloneClient', () => ({
    getStandaloneUnleashClient: () => ({ isEnabled: mockIsEnabled }),
}));

const setLumoPlans2026 = (enabled: boolean) => {
    mockIsEnabled.mockImplementation((flag: string) => flag === 'LumoPlans2026' && enabled);
};

const getPlansMap = (): PlansMap => {
    const plansMap = getTestPlansMap('USD');
    const lumoPlus = plansMap[PLANS.LUMO]!;

    return {
        ...plansMap,
        [PLANS.LUMO_BASIC]: { ...lumoPlus, ID: 'lumo-basic-id', Name: PLANS.LUMO_BASIC, Title: 'Lumo Basic' },
        [PLANS.LUMO_ULTRA]: { ...lumoPlus, ID: 'lumo-ultra-id', Name: PLANS.LUMO_ULTRA, Title: 'Lumo Ultra' },
    };
};

const toTexts = (features: PlanCardFeatureDefinition[]) => {
    return features.map(({ text }) => text);
};

const getCard = (plan: PLANS, options: { prioritizeLumoFeatures?: boolean } = {}) => {
    const shortPlan = getShortPlan(plan, getPlansMap(), { freePlan: FREE_PLAN, ...options });
    if (!shortPlan) {
        throw new Error(`No short plan for ${plan}`);
    }
    return { description: shortPlan.description, intro: shortPlan.featuresIntro, texts: toTexts(shortPlan.features) };
};

const currentLumoProfessionalTexts = [
    'Zero-access encryption',
    'Unlimited daily chats',
    'Web search access',
    'Full chat history with search',
    'Upload and query multiple large files',
    'Access to advanced AI models',
    'Data never used for AI training',
    'Compliance with data protection regulations',
];

describe('Lumo 2026 plan cards', () => {
    describe('LumoPlans2026 on', () => {
        beforeEach(() => {
            setLumoPlans2026(true);
        });

        it('shows the Lumo Basic card', () => {
            expect(getCard(PLANS.LUMO_BASIC)).toEqual({
                description: 'For everyday chats',
                intro: 'Everything in Free, and:',
                texts: [
                    'More usage',
                    'More image generation',
                    'More Skills, Projects, and scheduled tasks',
                    'Lumo Code',
                ],
            });
        });

        it('shows the Lumo Plus card', () => {
            expect(getCard(PLANS.LUMO)).toEqual({
                description: 'For getting more done',
                intro: 'Everything in Basic, and:',
                texts: ['2x Basic usage', 'Extended image generation', 'Maximum Skills and Projects'],
            });
        });

        it('shows the Lumo Ultra card', () => {
            expect(getCard(PLANS.LUMO_ULTRA)).toEqual({
                description: 'For coding and building',
                intro: 'Everything in Plus, and:',
                texts: ['5x Plus usage', 'Maximum image generation', 'API access, with US$50 a month credit'],
            });
        });

        it('adds API access to the current Lumo Professional card', () => {
            expect(getCard(PLANS.LUMO_BUSINESS).texts).toEqual([
                ...currentLumoProfessionalTexts,
                'API access, with US$5 a month credit per user',
            ]);
        });

        it('puts API access first on Workspace Premium in the Lumo app', () => {
            expect(getCard(PLANS.BUNDLE_BIZ_2025, { prioritizeLumoFeatures: true }).texts).toEqual([
                'API access, with US$5 a month credit per user',
                ...getCard(PLANS.BUNDLE_BIZ_2025).texts,
            ]);
        });

        it('puts API access first on Visionary in the Lumo app', () => {
            expect(getCard(PLANS.VISIONARY, { prioritizeLumoFeatures: true }).texts).toEqual([
                'API access, with US$25 a month credit',
                ...getCard(PLANS.VISIONARY).texts,
            ]);
        });

        it('keeps Workspace Premium and Visionary without Lumo lines outside the Lumo app', () => {
            expect(getCard(PLANS.BUNDLE_BIZ_2025).texts).not.toContain('API access, with US$5 a month credit per user');
            expect(getCard(PLANS.VISIONARY).texts).not.toContain('API access, with US$25 a month credit');
        });

        it('lists what the free plan has', () => {
            expect(toTexts(getLumoFree2026Features())).toEqual([
                'Limited messages and chat history',
                'Limited Skills, Projects, and scheduled tasks',
                'Limited image generation',
            ]);
        });
    });

    describe('LumoPlans2026 off', () => {
        beforeEach(() => {
            setLumoPlans2026(false);
        });

        it('keeps the current Lumo Plus card', () => {
            expect(getCard(PLANS.LUMO)).toEqual({
                description: 'High-speed chats and advanced AI features.',
                intro: undefined,
                texts: [
                    'Unlimited daily chats',
                    'Web search access',
                    'Full chat history with search',
                    'Unlimited favorites for quick access',
                    'Upload and query multiple large files',
                    'Access to advanced AI models',
                    'Priority support',
                ],
            });
        });

        it('keeps the current Lumo Professional card', () => {
            expect(getCard(PLANS.LUMO_BUSINESS).texts).toEqual(currentLumoProfessionalTexts);
        });

        it('adds no Lumo lines to Workspace Premium and Visionary in the Lumo app', () => {
            expect(getCard(PLANS.BUNDLE_BIZ_2025, { prioritizeLumoFeatures: true })).toEqual(
                getCard(PLANS.BUNDLE_BIZ_2025)
            );
            expect(getCard(PLANS.VISIONARY, { prioritizeLumoFeatures: true })).toEqual(getCard(PLANS.VISIONARY));
        });
    });
});
