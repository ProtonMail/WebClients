import { DEFAULT_CONTEXT_LIMITS, deriveContextLimits } from './contextLimits';
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
