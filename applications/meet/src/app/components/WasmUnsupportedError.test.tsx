import { render, screen, within } from '@testing-library/react';

import { WasmUnsupportedError } from './WasmUnsupportedError';

describe('WasmUnsupportedError', () => {
    it('shows an alert with a decorative illustration, a heading and the advice, and no action', () => {
        render(<WasmUnsupportedError />);

        const alert = screen.getByRole('alert');

        expect(within(alert).getByRole('presentation')).toHaveAttribute('alt', '');
        expect(within(alert).getByRole('heading', { level: 1, name: 'Browser not supported' })).toBeInTheDocument();
        expect(alert).toHaveTextContent(
            'Proton Meet needs WebAssembly, which is off or not available in this browser. Turn it on, or use another browser.'
        );
        expect(within(alert).queryByRole('button')).not.toBeInTheDocument();
    });
});
