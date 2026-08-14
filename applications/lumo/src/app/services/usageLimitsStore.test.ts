import {
    isModelSwitchSuggestionEligible,
    resolveAvailableModelTier,
    resolveDefaultModelTier,
    shouldShowModelSwitchSuggestion,
} from './usageLimitsStore';

describe('resolveDefaultModelTier', () => {
    it('prefers max when it is selectable', () => {
        expect(resolveDefaultModelTier({ lite: 10, max: 20 })).toBe('lumo-max');
        expect(resolveDefaultModelTier(null)).toBe('lumo-max');
    });

    it('falls back to lite when max is unavailable', () => {
        expect(resolveDefaultModelTier({ lite: 10, max: 20 }, { isMaxAvailable: false })).toBe('lumo-lite');
        expect(resolveDefaultModelTier({ lite: 10, max: 0 })).toBe('lumo-lite');
    });
});

describe('resolveAvailableModelTier', () => {
    it('keeps the current model when it has quota', () => {
        expect(resolveAvailableModelTier('lumo-lite', { lite: 10, max: 20 })).toBe('lumo-lite');
        expect(resolveAvailableModelTier('lumo-max', { lite: 10, max: 20 })).toBe('lumo-max');
    });

    it('falls back to the other model when the current one is exhausted', () => {
        expect(resolveAvailableModelTier('lumo-lite', { lite: 0, max: 20 })).toBe('lumo-max');
        expect(resolveAvailableModelTier('lumo-max', { lite: 10, max: 0 })).toBe('lumo-lite');
    });

    it('keeps the current model when both pools are exhausted', () => {
        expect(resolveAvailableModelTier('lumo-lite', { lite: 0, max: 0 })).toBe('lumo-lite');
    });

    it('keeps the current model when limits are unknown', () => {
        expect(resolveAvailableModelTier('lumo-lite', null)).toBe('lumo-lite');
    });

    it('falls back from max to lite when max is disabled by high load', () => {
        expect(resolveAvailableModelTier('lumo-max', { lite: 10, max: 20 }, { isMaxAvailable: false })).toBe(
            'lumo-lite'
        );
    });

    it('does not fall back to max when max is disabled by high load', () => {
        expect(resolveAvailableModelTier('lumo-lite', { lite: 0, max: 20 }, { isMaxAvailable: false })).toBe(
            'lumo-lite'
        );
    });
});

describe('shouldShowModelSwitchSuggestion', () => {
    const baseArgs = {
        hasLumoPlus: false,
        selectedModelTier: 'lumo-lite' as const,
        remainingLimits: { lite: 10, max: 20 },
        weeklyLimitUpsellVisible: false,
        messageCount: 2,
        isGenerating: false,
        isMaxAvailableByFlag: true,
    };

    it('shows when on lite with quota on both models after an exchange', () => {
        expect(shouldShowModelSwitchSuggestion(baseArgs)).toBe(true);
    });

    it('hides when on max', () => {
        expect(shouldShowModelSwitchSuggestion({ ...baseArgs, selectedModelTier: 'lumo-max' })).toBe(false);
    });

    it('hides when max is exhausted', () => {
        expect(
            shouldShowModelSwitchSuggestion({
                ...baseArgs,
                remainingLimits: { lite: 10, max: 0 },
            })
        ).toBe(false);
    });

    it('hides when max is unavailable due to high load', () => {
        expect(shouldShowModelSwitchSuggestion({ ...baseArgs, isMaxAvailableByFlag: false })).toBe(false);
    });

    it('hides while generating even when otherwise eligible', () => {
        expect(isModelSwitchSuggestionEligible(baseArgs)).toBe(true);
        expect(shouldShowModelSwitchSuggestion({ ...baseArgs, isGenerating: true })).toBe(false);
    });
});
