import { render, screen } from '@testing-library/react';

import { ApiKeyUsageExpanded } from './ApiKeyUsageCharts';

jest.mock('./ApiTokenUsageChart', () => ({
    ApiTokenUsageChart: ({ days }: { days: unknown[] }) => (
        <div data-testid="token-usage-chart">{JSON.stringify(days)}</div>
    ),
}));

describe('ApiKeyUsageExpanded', () => {
    it('charts the key’s input and output tokens as API usage', () => {
        render(
            <ApiKeyUsageExpanded
                usage={{
                    days: [{ Date: '2026-11-09', TokenCount: 4, InputTokenCount: 3, OutputTokenCount: 1, ApiCalls: 1 }],
                    totalTokenCount: 4,
                    totalInputTokenCount: 3,
                    totalOutputTokenCount: 1,
                    totalApiCalls: 1,
                    isLoading: false,
                    error: false,
                }}
            />
        );

        expect(JSON.parse(screen.getByTestId('token-usage-chart').textContent ?? '')).toEqual([
            { date: '2026-11-09', apiInputTokens: 3, apiOutputTokens: 1 },
        ]);
        expect(screen.getByText('API input')).toBeInTheDocument();
        expect(screen.queryByText('Chat input')).not.toBeInTheDocument();
    });
});
