import { fireEvent, render, screen } from '@testing-library/react';

import TextFieldBody from './TextFieldBody';

describe('TextFieldBody', () => {
    it('reports the edited value', () => {
        const onChange = jest.fn();
        render(<TextFieldBody label="Name" value="Receipts" onChange={onChange} />);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Invoices' } });
        expect(onChange).toHaveBeenCalledWith('Invoices');
    });

    it('renders a textarea of the requested height only when rows exceeds one', () => {
        const { unmount } = render(<TextFieldBody label="Signature" value="Sent from Proton" onChange={jest.fn()} />);
        expect(screen.getByRole('textbox').tagName).toBe('INPUT');
        unmount();

        render(<TextFieldBody label="Signature" value="Sent from Proton" onChange={jest.fn()} rows={4} />);
        const multiline = screen.getByRole('textbox');
        expect(multiline.tagName).toBe('TEXTAREA');
        expect(multiline).toHaveAttribute('rows', '4');
    });
});
