import {
    getMaxModelAvailability,
    getRemainingLimits,
    isModelSwitchSuggestionEligible,
    resolveAvailableModelTier,
    resolveDefaultModelTier,
    setDebugMaxModelOverride,
    setRemainingLimits,
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

describe('getMaxModelAvailability', () => {
    it('reports available when max is selectable', () => {
        expect(getMaxModelAvailability({ lite: 10, max: 20 }, { isMaxAvailable: true })).toBe('available');
        expect(getMaxModelAvailability(null)).toBe('available');
    });

    it('reports an exhausted quota', () => {
        expect(getMaxModelAvailability({ lite: 10, max: 0 }, { isMaxAvailable: true })).toBe(
            'unavailable_limit_reached'
        );
    });

    it('reports the availability flag being off', () => {
        expect(getMaxModelAvailability({ lite: 10, max: 20 }, { isMaxAvailable: false })).toBe('unavailable_high_load');
    });

    it('prefers high load over an exhausted quota, matching the web picker', () => {
        expect(getMaxModelAvailability({ lite: 10, max: 0 }, { isMaxAvailable: false })).toBe('unavailable_high_load');
    });
});

describe('setDebugMaxModelOverride', () => {
    afterEach(() => {
        setDebugMaxModelOverride(null);
    });

    it('pins max to zero for a forced limit while keeping the other pools intact', () => {
        setRemainingLimits({ lite: 10, max: 20, images: 3 });
        setDebugMaxModelOverride('unavailable_limit_reached');

        expect(getRemainingLimits()).toEqual({ lite: 10, max: 0, images: 3 });
        expect(resolveDefaultModelTier(getRemainingLimits())).toBe('lumo-lite');
    });

    it('leaves the quota alone for forced high load, which the availability flag handles', () => {
        setRemainingLimits({ lite: 10, max: 20 });
        setDebugMaxModelOverride('unavailable_high_load');

        expect(getRemainingLimits()).toEqual({ lite: 10, max: 20 });
    });

    it('reports max as exhausted even before the backend sends any limits', () => {
        // Fresh module instance so no earlier `setRemainingLimits` call is in scope.
        jest.isolateModules(() => {
            const store = require('./usageLimitsStore');
            store.setDebugMaxModelOverride('unavailable_limit_reached');

            expect(store.getRemainingLimits()).toEqual({ max: 0 });
            store.setDebugMaxModelOverride(null);
        });
    });

    it('keeps overriding limits that arrive after it is switched on', () => {
        setDebugMaxModelOverride('unavailable_limit_reached');
        setRemainingLimits({ lite: 5, max: 42 });

        expect(getRemainingLimits()).toEqual({ lite: 5, max: 0 });
    });

    it('restores the backend limits when switched off', () => {
        setRemainingLimits({ lite: 10, max: 20 });
        setDebugMaxModelOverride('unavailable_limit_reached');
        setDebugMaxModelOverride(null);

        expect(getRemainingLimits()).toEqual({ lite: 10, max: 20 });
    });
});
