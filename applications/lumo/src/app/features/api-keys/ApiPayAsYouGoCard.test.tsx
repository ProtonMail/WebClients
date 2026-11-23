import { render, screen } from '@testing-library/react';

import { ApiPayAsYouGoCard } from './ApiPayAsYouGoCard';
import { ApiUsageModelStats } from './ApiUsageModelStats';

describe('token prices', () => {
    it('lists the pay-as-you-go prices in credits', () => {
        render(<ApiPayAsYouGoCard />);

        expect(
            screen.getByText('Pay only for the tokens you use. Prices in credits per 1M tokens.')
        ).toBeInTheDocument();
        expect(screen.getByText('0.25 credits')).toBeInTheDocument();
        expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    });

    it('shows the model rates in credits under the usage', () => {
        render(<ApiUsageModelStats model="lumo-max" inputTokens={0} outputTokens={0} formattedCost="0 credits" />);

        expect(screen.getByText('3 credits per 1M tokens')).toBeInTheDocument();
        expect(screen.getByText('Cached input 1 credit per 1M tokens.')).toBeInTheDocument();
    });
});
