import { PassFeature } from '../../types/api/features';
import { ShareFlags } from '../../types/data/shares';
import type { FeatureFlagState, FeatureFlagVariants, ShareItem } from '../reducers';
import type { State } from '../types';
import { selectAutofillModelExperimentGroup, selectCanRevealSensitiveContent } from './user';

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

describe('`selectCanRevealSensitiveContent`', () => {
    const shareId = 'share-id';
    const hiddenShare = { flags: ShareFlags.HIDE_SENSITIVE_CONTENT } as ShareItem;
    const visibleShare = { flags: 0 } as ShareItem;

    const mockShareState = (features: FeatureFlagState | null, shares: Record<string, ShareItem> = {}): State =>
        ({ user: { features }, shares }) as State;

    test('is revealable when the feature flag is off, even if the share hides sensitive content', () => {
        const state = mockShareState({ [PassFeature.Pass__V1_44__ShareWithHiddenPassword]: false }, { [shareId]: hiddenShare });
        expect(selectCanRevealSensitiveContent(shareId)(state)).toBe(true);
    });

    test('is revealable when the flag is on but the share is unknown', () => {
        const state = mockShareState({ [PassFeature.Pass__V1_44__ShareWithHiddenPassword]: true });
        expect(selectCanRevealSensitiveContent(shareId)(state)).toBe(true);
    });

    test('is revealable when the flag is on and the share does not hide sensitive content', () => {
        const state = mockShareState({ [PassFeature.Pass__V1_44__ShareWithHiddenPassword]: true }, { [shareId]: visibleShare });
        expect(selectCanRevealSensitiveContent(shareId)(state)).toBe(true);
    });

    test('is not revealable when the flag is on and the share hides sensitive content', () => {
        const state = mockShareState({ [PassFeature.Pass__V1_44__ShareWithHiddenPassword]: true }, { [shareId]: hiddenShare });
        expect(selectCanRevealSensitiveContent(shareId)(state)).toBe(false);
    });
});
