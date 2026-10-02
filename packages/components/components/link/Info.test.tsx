import { render, screen } from '@testing-library/react';

import Info from './Info';

describe('Info', () => {
    it('names its button after a text title', () => {
        render(<Info title="Billed once a year" />);
        expect(screen.getByRole('button', { name: 'More info: Billed once a year' })).toBeInTheDocument();
    });

    it('names its button "More info" when the title has elements in it', () => {
        render(<Info title={['Starts on ', <time key="time">Nov 1, 2026</time>]} />);
        expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument();
        expect(screen.queryByText(/object Object/)).not.toBeInTheDocument();
    });
});
