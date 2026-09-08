import {
    applyUsageFromStreamMessage,
    getDismissibleExhaustedModel,
    getExhaustedLimitForModel,
    getExhaustedLimitNotice,
    getLimitCategoryForTier,
    getMaxModelAvailability,
    getRemainingForModelTier,
    getRemainingLimits,
    getTierForLimitCategory,
    isAnyModelLimitExhausted,
    isModelSwitchSuggestionEligible,
    isModelTierSelectable,
    resolveAvailableModelTier,
    resolveDefaultModelTier,
    setDebugMaxModelOverride,
    setDebugModelLimitsExhausted,
    setRemainingLimits,
    shouldShowLimitUpsell,
    shouldShowModelSwitchSuggestion,
} from './usageLimitsStore';

describe('model tier limit category mapping', () => {
    it('maps tiers to quota buckets and back', () => {
        expect(getLimitCategoryForTier('lumo-max')).toBe('max');
        expect(getLimitCategoryForTier('lumo-lite')).toBe('lite');
        expect(getLimitCategoryForTier('apertus-15')).toBe('lite');
        expect(getTierForLimitCategory('max')).toBe('lumo-max');
        expect(getTierForLimitCategory('lite')).toBe('lumo-lite');
    });
});

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

    it('keeps apertus-15 when the shared lite quota is exhausted', () => {
        expect(resolveAvailableModelTier('apertus-15', { lite: 0, max: 20 })).toBe('apertus-15');
    });

    it('falls back to lite when apertus-15 is disabled by its feature flag', () => {
        expect(resolveAvailableModelTier('apertus-15', { lite: 10, max: 20 }, { isApertusEnabled: false })).toBe(
            'lumo-lite'
        );
    });
});

describe('getRemainingForModelTier', () => {
    it('shares the lite quota with apertus-15', () => {
        expect(getRemainingForModelTier('apertus-15', { lite: 5, max: 20 })).toBe(5);
        expect(isModelTierSelectable('apertus-15', { lite: 0, max: 20 })).toBe(false);
        expect(isModelTierSelectable('apertus-15', { lite: 5, max: 20 })).toBe(true);
        expect(isModelTierSelectable('apertus-15', { lite: 5, max: 20 }, { isApertusEnabled: false })).toBe(false);
    });
});

describe('shouldShowModelSwitchSuggestion', () => {
    const baseArgs = {
        hasLumoPlus: false,
        selectedModelTier: 'lumo-lite' as const,
        remainingLimits: { lite: 10, max: 20 },
        limitUpsellVisible: false,
        messageCount: 2,
        isGenerating: false,
        isMaxAvailableByFlag: true,
    };

    it('shows when on lite with quota on both models after an exchange', () => {
        expect(shouldShowModelSwitchSuggestion(baseArgs)).toBe(true);
    });

    it('shows when on apertus-15 with quota on both models after an exchange', () => {
        expect(shouldShowModelSwitchSuggestion({ ...baseArgs, selectedModelTier: 'apertus-15' })).toBe(true);
    });

    it('hides when on max', () => {
        expect(shouldShowModelSwitchSuggestion({ ...baseArgs, selectedModelTier: 'lumo-max' })).toBe(false);
    });

    it('shows when apertus-15 has exhausted its shared lite quota but max remains', () => {
        expect(
            shouldShowModelSwitchSuggestion({
                ...baseArgs,
                selectedModelTier: 'apertus-15',
                remainingLimits: { lite: 0, max: 20 },
                messageCount: 0,
            })
        ).toBe(true);
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

describe('limit upsell', () => {
    it('is eligible when Lite is exhausted', () => {
        expect(isAnyModelLimitExhausted({ lite: 0, max: 20 })).toBe(true);
        expect(shouldShowLimitUpsell({ lite: 0, max: 20 }, true, false, 'lumo-lite')).toBe(true);
    });

    it('is eligible when Max is exhausted', () => {
        expect(isAnyModelLimitExhausted({ lite: 100, max: 0 })).toBe(true);
        expect(shouldShowLimitUpsell({ lite: 100, max: 0 }, true, false, 'lumo-max')).toBe(true);
    });

    it('stays hidden when only the unselected model is exhausted', () => {
        expect(shouldShowLimitUpsell({ lite: 100, max: 0 }, true, false, 'lumo-lite')).toBe(false);
        expect(shouldShowLimitUpsell({ lite: 0, max: 20 }, true, false, 'lumo-max')).toBe(false);
    });

    it('uses the Lite pool for Apertus', () => {
        expect(shouldShowLimitUpsell({ lite: 0, max: 20 }, true, false, 'apertus-15')).toBe(true);
    });

    it('stays hidden for Plus users and before a tier error exists', () => {
        expect(shouldShowLimitUpsell({ lite: 0, max: 0 }, true, true, 'lumo-lite')).toBe(false);
        expect(shouldShowLimitUpsell({ lite: 0, max: 0 }, false, false, 'lumo-lite')).toBe(false);
    });

    it('is dismissible only when the other model remains available', () => {
        expect(getDismissibleExhaustedModel({ lite: 0, max: 20 })).toBe('lite');
        expect(getDismissibleExhaustedModel({ lite: 100, max: 0 })).toBe('max');
        expect(getDismissibleExhaustedModel({ lite: 0, max: 0 })).toBeUndefined();
        expect(getDismissibleExhaustedModel({ lite: 100, max: 20 })).toBeUndefined();
    });
});

describe('exhausted limit notices', () => {
    beforeEach(() => {
        setRemainingLimits({ lite: 10, max: 10 });
    });

    it('records the consumed model before fallback when its pool reaches zero', () => {
        applyUsageFromStreamMessage(
            {
                type: 'usage',
                usage: {
                    remaining_limits: { lite: 10, max: 0 },
                    applied_limit_category: 'max',
                },
            },
            'lumo-max'
        );

        expect(getExhaustedLimitNotice()).toEqual({
            limitCategory: 'max',
            modelTier: 'lumo-max',
        });
    });

    it('preserves Apertus as the display model for the shared Lite pool', () => {
        applyUsageFromStreamMessage(
            {
                type: 'usage',
                usage: {
                    remaining_limits: { lite: 0, max: 10 },
                    applied_limit_category: 'lite',
                },
            },
            'apertus-15'
        );

        expect(getExhaustedLimitNotice()).toEqual({
            limitCategory: 'lite',
            modelTier: 'apertus-15',
        });
    });

    it('clears the notice when that pool refreshes above zero', () => {
        applyUsageFromStreamMessage({
            type: 'usage',
            usage: {
                remaining_limits: { lite: 10, max: 0 },
                applied_limit_category: 'max',
            },
        });

        setRemainingLimits({ lite: 10, max: 10 });

        expect(getExhaustedLimitNotice()).toBeNull();
    });

    it('distinguishes a selected-model quota rejection from transient rate limiting', () => {
        expect(getExhaustedLimitForModel({ lite: 10, max: 0 }, 'lumo-max')).toEqual({
            limitCategory: 'max',
            modelTier: 'lumo-max',
        });
        expect(getExhaustedLimitForModel({ lite: 10, max: 0 }, 'lumo-lite')).toBeNull();
        expect(getExhaustedLimitForModel({ lite: 10, max: 10 }, 'lumo-max')).toBeNull();
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
        setDebugModelLimitsExhausted(false);
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

describe('setDebugModelLimitsExhausted', () => {
    afterEach(() => {
        setDebugModelLimitsExhausted(false);
        setDebugMaxModelOverride(null);
    });

    it('pins lite and max to zero while keeping other pools intact', () => {
        setRemainingLimits({ lite: 10, max: 20, images: 3 });
        setDebugModelLimitsExhausted(true);

        expect(getRemainingLimits()).toEqual({ lite: 0, max: 0, images: 3 });
    });

    it('reports both pools as exhausted even before the backend sends any limits', () => {
        jest.isolateModules(() => {
            const store = require('./usageLimitsStore');
            store.setDebugModelLimitsExhausted(true);

            expect(store.getRemainingLimits()).toEqual({ lite: 0, max: 0 });
            store.setDebugModelLimitsExhausted(false);
        });
    });

    it('restores backend limits when switched off', () => {
        setRemainingLimits({ lite: 10, max: 20 });
        setDebugModelLimitsExhausted(true);
        setDebugModelLimitsExhausted(false);

        expect(getRemainingLimits()).toEqual({ lite: 10, max: 20 });
    });

    it('takes precedence over the max-only debug override', () => {
        setRemainingLimits({ lite: 10, max: 20 });
        setDebugMaxModelOverride('unavailable_limit_reached');
        setDebugModelLimitsExhausted(true);

        expect(getRemainingLimits()).toEqual({ lite: 0, max: 0 });
    });
});
