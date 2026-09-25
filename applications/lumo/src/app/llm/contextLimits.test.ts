import {
    DEFAULT_CONTEXT_LIMITS,
    deriveContextLimits,
    getCompactionTargetTokens,
    getContextWindowConfig,
    getProactiveCompactionThresholdTokens,
} from './contextLimits';
import { getContextLimitsForModelId } from './modelContextLimits';
import { setModels } from '../services/modelsStore';

describe('deriveContextLimits', () => {
    it('preserves default thresholds when max context matches the legacy window', () => {
        expect(deriveContextLimits(DEFAULT_CONTEXT_LIMITS.MAX_CONTEXT)).toEqual(DEFAULT_CONTEXT_LIMITS);
    });

    it('scales warning and danger thresholds with max context length', () => {
        const limits = deriveContextLimits(262_144);
        expect(limits.MAX_CONTEXT).toBe(262_144);
        expect(limits.WARNING_THRESHOLD).toBe(Math.round(262_144 * (110_000 / 130_000)));
        expect(limits.DANGER_THRESHOLD).toBe(Math.round(262_144 * (120_000 / 130_000)));
    });
});

describe('getContextWindowConfig', () => {
    it('bundles limits with derived compaction and file budgets', () => {
        const config = getContextWindowConfig(DEFAULT_CONTEXT_LIMITS);
        expect(config.limits).toEqual(DEFAULT_CONTEXT_LIMITS);
        expect(config.compactionTargetTokens).toBe(getCompactionTargetTokens(DEFAULT_CONTEXT_LIMITS));
        expect(config.proactiveCompactionThresholdTokens).toBe(
            getProactiveCompactionThresholdTokens(DEFAULT_CONTEXT_LIMITS)
        );
        expect(config.requestInputTokenBudget).toBe(Math.round(DEFAULT_CONTEXT_LIMITS.MAX_CONTEXT * 0.78));
    });
});

describe('compaction thresholds', () => {
    it('derives target and proactive thresholds from model limits', () => {
        const limits = deriveContextLimits(131_072);
        expect(getCompactionTargetTokens(limits)).toBe(Math.round(131_072 * 0.5));
        expect(getProactiveCompactionThresholdTokens(limits)).toBe(Math.round(131_072 * 0.9));
    });
});

describe('getContextLimitsForModelId', () => {
    afterEach(() => {
        setModels([]);
    });

    it('falls back to defaults when model metadata is missing', () => {
        expect(getContextLimitsForModelId('unknown-model')).toEqual(DEFAULT_CONTEXT_LIMITS);
    });

    it('uses max_context_length from the models store', () => {
        setModels([
            {
                object: 'model',
                id: 'lumo-max',
                created: 1,
                owned_by: 'proton',
                max_context_length: 131_072,
            },
        ]);

        expect(getContextLimitsForModelId('lumo-max').MAX_CONTEXT).toBe(131_072);
    });
});
