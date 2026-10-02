import { type GuardFields, normalizeGuardResult } from './guard';

type RawCheckResponse = GuardFields & Record<string, unknown>;

const buildResponse = (props: Record<string, unknown>) => props as RawCheckResponse;

describe('normalizeGuardResult', () => {
    it('returns an empty GuardResult when no guard fields are present', () => {
        expect(normalizeGuardResult(buildResponse({ Amount: 1500 }))?.GuardResult).toEqual([]);
        expect(normalizeGuardResult(buildResponse({ GuardResult: null }))?.GuardResult).toEqual([]);
    });

    it('normalizes the transition shape (string + GuardResultCode) to a single-entry array', () => {
        const result = normalizeGuardResult(
            buildResponse({
                GuardResult: 'You are using more storage than this plan allows.',
                GuardResultCode: 8010505,
            })
        );
        expect(result?.GuardResult).toEqual([
            { Code: 8010505, Message: 'You are using more storage than this plan allows.' },
        ]);
        expect(result).not.toHaveProperty('GuardResultCode');
    });

    it('normalizes a transition string without a code', () => {
        const result = normalizeGuardResult(buildResponse({ GuardResult: 'Some refusal' }));
        expect(result?.GuardResult).toEqual([{ Code: undefined, Message: 'Some refusal' }]);
    });

    it('passes through a list of guard errors unchanged', () => {
        const errors = [
            { Code: 8010505, Message: 'Storage' },
            { Code: 8010503, Message: 'Members' },
        ];
        expect(normalizeGuardResult(buildResponse({ GuardResult: errors }))?.GuardResult).toEqual(errors);
    });

    it('wraps a single guard error object into a list', () => {
        const error = { Code: 8010200, Message: 'Scribe' };
        expect(normalizeGuardResult(buildResponse({ GuardResult: error }))?.GuardResult).toEqual([error]);
    });

    it('does not modify the input response', () => {
        const response = buildResponse({ GuardResult: 'refusal', GuardResultCode: 8010505 });
        const result = normalizeGuardResult(response);
        expect(response).toEqual({ GuardResult: 'refusal', GuardResultCode: 8010505 });
        expect(result).not.toBe(response);
    });

    it('preserves the other response fields', () => {
        const result = normalizeGuardResult(buildResponse({ Amount: 1500, Currency: 'USD', GuardResult: 'refusal' }));
        expect(result?.Amount).toBe(1500);
        expect(result?.Currency).toBe('USD');
    });
});
