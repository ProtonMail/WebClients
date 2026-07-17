import { render, screen } from '@testing-library/react';

import LumoThinking from './LumoThinking';

describe('LumoThinking', () => {
    it('renders the default status label', () => {
        render(<LumoThinking />);
        expect(screen.getByText('Thinking about this')).toBeInTheDocument();
    });

    it('renders a supplied label and exposes it as an accessible name', () => {
        render(<LumoThinking label="Working on it" />);
        expect(screen.getByLabelText('Working on it')).toBeInTheDocument();
    });
});
