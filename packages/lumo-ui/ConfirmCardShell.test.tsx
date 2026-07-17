import { fireEvent, render, screen } from '@testing-library/react';

import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';

import ConfirmCardShell from './ConfirmCardShell';

describe('ConfirmCardShell', () => {
    it('renders the title, subtitle and body, and wires apply/cancel', () => {
        const onApply = jest.fn();
        const onCancel = jest.fn();
        render(
            <ConfirmCardShell
                icon={IcFolderArrowIn}
                title="Move 4 emails"
                subtitle="→ Archive"
                onApply={onApply}
                onCancel={onCancel}
            >
                <p>body</p>
            </ConfirmCardShell>
        );

        expect(screen.getByText('Move 4 emails')).toBeInTheDocument();
        expect(screen.getByText('→ Archive')).toBeInTheDocument();
        expect(screen.getByText('body')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
        fireEvent.click(screen.getByRole('button', { name: 'Reject' }));
        expect(onApply).toHaveBeenCalledTimes(1);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('disables Apply when applyDisabled is set', () => {
        render(
            <ConfirmCardShell
                icon={IcFolderArrowIn}
                title="Move"
                applyDisabled
                onApply={jest.fn()}
                onCancel={jest.fn()}
            />
        );
        expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    });
});
