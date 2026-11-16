import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { IcFolderArrowIn } from '@proton/icons/icons/IcFolderArrowIn';

import ConfirmCardShell from './ConfirmCardShell';

describe('ConfirmCardShell', () => {
    it('renders the sentence and the body, and wires apply/cancel', () => {
        const onApply = vi.fn();
        const onCancel = vi.fn();
        render(
            <ConfirmCardShell
                icon={IcFolderArrowIn}
                sentence="Move 4 emails to Archive"
                onApply={onApply}
                onCancel={onCancel}
            >
                <p>body</p>
            </ConfirmCardShell>
        );

        expect(screen.getByText('Move 4 emails to Archive')).toBeInTheDocument();
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
                sentence="Move"
                applyDisabled
                onApply={vi.fn()}
                onCancel={vi.fn()}
            />
        );
        expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    });

    it('omits the scrolling body region when there is no body', () => {
        const { container } = render(
            <ConfirmCardShell icon={IcFolderArrowIn} sentence="Move" onApply={vi.fn()} onCancel={vi.fn()} />
        );
        expect(container.querySelector('.lumo-confirm-card__body')).toBeNull();
    });

    it('mounts the body inside a scrolling region', () => {
        const { container } = render(
            <ConfirmCardShell icon={IcFolderArrowIn} sentence="Move" onApply={vi.fn()} onCancel={vi.fn()}>
                <p>body</p>
            </ConfirmCardShell>
        );
        expect(container.querySelector('.lumo-confirm-card__body.scroll-outer-vertical')).toContainElement(
            screen.getByText('body')
        );
    });
});
