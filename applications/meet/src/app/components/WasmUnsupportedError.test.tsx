import { render, screen, within } from '@testing-library/react';

import { WasmUnsupportedError } from './WasmUnsupportedError';

describe('WasmUnsupportedError', () => {
    it('shows an alert with a heading and the advice, and no action', () => {
        render(<WasmUnsupportedError />);

        const alert = screen.getByRole('alert');

        expect(within(alert).getByRole('heading', { level: 1, name: 'Browser not supported' })).toBeInTheDocument();
        expect(alert).toHaveTextContent('Update your browser or use another one.');
        expect(within(alert).queryByRole('button')).not.toBeInTheDocument();
    });
});
