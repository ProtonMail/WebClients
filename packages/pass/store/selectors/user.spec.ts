import type { FeatureFlagVariants } from '@proton/pass/store/reducers';
import type { State } from '@proton/pass/store/types';
import { PassFeature } from '@proton/pass/types/api/features';

import { selectAutofillModelExperimentGroup } from './user';

const mockState = (featureVariants: FeatureFlagVariants | null): State => ({ user: { featureVariants } }) as State;

describe('`selectAutofillModelExperimentGroup`', () => {
    test('resolves the assigned group when the variant is `control`', () => {
        const state = mockState({ [PassFeature.PassAutofillModelExperimentGroup]: { name: 'control', payload: null } });
        expect(selectAutofillModelExperimentGroup(state)).toBe('control');
    });

    test('resolves the assigned group when the variant is `challenger`', () => {
        const state = mockState({ [PassFeature.PassAutofillModelExperimentGroup]: { name: 'challenger', payload: null } });
        expect(selectAutofillModelExperimentGroup(state)).toBe('challenger');
    });

    test('falls back to `control` when the variant is missing (flag disabled, not yet fetched)', () => {
        expect(selectAutofillModelExperimentGroup(mockState(null))).toBe('control');
        expect(selectAutofillModelExperimentGroup(mockState({}))).toBe('control');
    });

    test('defensively falls back to `control` for any unrecognized variant name', () => {
        const state = mockState({ [PassFeature.PassAutofillModelExperimentGroup]: { name: 'disabled', payload: null } });
        expect(selectAutofillModelExperimentGroup(state)).toBe('control');
    });
});
