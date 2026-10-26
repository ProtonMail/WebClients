import { normalizePersonalAccessTokenUsageDay } from './usePersonalAccessTokenUsage';

describe('normalizePersonalAccessTokenUsageDay', () => {
    it('treats the legacy token count as output tokens', () => {
        expect(
            normalizePersonalAccessTokenUsageDay({
                Date: '2026-09-01',
                TokenCount: 42,
                ApiCalls: 2,
            })
        ).toEqual({
            Date: '2026-09-01',
            InputTokenCount: 0,
            OutputTokenCount: 42,
            TokenCount: 42,
            ApiCalls: 2,
        });
    });

    it('combines explicit input and output token counts', () => {
        expect(
            normalizePersonalAccessTokenUsageDay({
                Date: '2026-09-01',
                TokenCount: 999,
                InputTokenCount: 10,
                OutputTokenCount: 20,
                ApiCalls: 1,
            })
        ).toEqual({
            Date: '2026-09-01',
            InputTokenCount: 10,
            OutputTokenCount: 20,
            TokenCount: 30,
            ApiCalls: 1,
        });
    });
});
