import { IcMagicWand } from '@proton/icons/icons/IcMagicWand';
import { PLANS } from '@proton/payments/core/constants';
import type { PlansMap } from '@proton/payments/core/plan/interface';

import type { PlanCardFeature } from './interface';
import { getMailFeatures } from './mail';

type ScribeColumn = keyof PlanCardFeature['plans'];

const mockIsEnabled = jest.fn();
jest.mock('@proton/unleash/standaloneClient', () => ({
    getStandaloneUnleashClient: () => ({ isEnabled: mockIsEnabled }),
}));

const getScribePlans = (scribeToLumo: boolean) => {
    mockIsEnabled.mockReturnValue(scribeToLumo);
    const row = getMailFeatures({} as PlansMap).find(({ name }) => name === 'scribe');
    if (!row) {
        throw new Error('scribe feature row not found');
    }
    return row.plans;
};

const scribeDefinition = {
    id: 'proton-scribe',
    text: 'Proton Scribe writing assistant',
    icon: IcMagicWand,
    included: true,
};

const expandedColumns: ScribeColumn[] = [PLANS.BUNDLE_BIZ_2025, PLANS.LUMO, PLANS.LUMO_BUSINESS, PLANS.VISIONARY];
const limitedColumns: ScribeColumn[] = [PLANS.FREE, PLANS.MAIL, PLANS.DUO, PLANS.FAMILY, PLANS.BUNDLE_PRO_2024];

describe('getMailFeatures — scribe row', () => {
    describe('ScribeToLumo ON', () => {
        it('shows the writing assistant on every plan column', () => {
            const missingColumns = Object.entries(getScribePlans(true))
                .filter(([, definition]) => !definition)
                .map(([plan]) => plan);

            expect(missingColumns).toEqual([]);
        });

        it.each(expandedColumns)('gives %s expanded access', (plan) => {
            expect(getScribePlans(true)[plan]?.text).toBe('Lumo writing assistant with expanded access');
        });

        it.each(limitedColumns)('gives %s limited access', (plan) => {
            expect(getScribePlans(true)[plan]?.text).toBe('Lumo writing assistant with limited access');
        });
    });

    describe('ScribeToLumo OFF', () => {
        it('shows Scribe on exactly the pre-rebrand columns, and nothing else', () => {
            const includedColumns = Object.entries(getScribePlans(false)).filter(([, definition]) => definition);

            expect(Object.fromEntries(includedColumns)).toEqual({
                [PLANS.FAMILY]: scribeDefinition,
                [PLANS.DUO]: scribeDefinition,
                [PLANS.BUNDLE_BIZ_2025]: scribeDefinition,
                [PLANS.VISIONARY]: scribeDefinition,
            });
        });
    });
});
