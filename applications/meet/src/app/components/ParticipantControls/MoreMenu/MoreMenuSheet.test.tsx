import { fireEvent, render, screen } from '@testing-library/react';

import { MoreMenuSheet } from './MoreMenuSheet';

const mocks = vi.hoisted(() => ({
    isMobile: vi.fn(() => false),
}));

vi.mock('@proton/shared/lib/helpers/browser', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    isMobile: mocks.isMobile,
}));

vi.mock('./useMeetingActions', () => ({
    useMeetingActions: () => ({}),
}));

vi.mock('../../../hooks/bridges/useEmojiReaction', () => ({
    useEmojiReaction: () => vi.fn(),
    useAvailableEmojiReactions: () => [],
}));

const renderSheet = () => {
    const onClose = vi.fn();
    render(<MoreMenuSheet onClose={onClose} toggles={[]} actions={[]} />);
    return { onClose };
};

describe('MoreMenuSheet', () => {
    it('is a dialog named like its opener', () => {
        renderSheet();

        expect(screen.getByRole('dialog', { name: 'More options' })).toBeInTheDocument();
    });

    it('takes focus when it opens', () => {
        const Opener = ({ isOpen }: { isOpen: boolean }) => (
            <>
                <button type="button">More options</button>
                {isOpen && <MoreMenuSheet onClose={vi.fn()} toggles={[]} actions={[]} />}
            </>
        );
        const { rerender } = render(<Opener isOpen={false} />);
        screen.getByRole('button', { name: 'More options' }).focus();

        rerender(<Opener isOpen />);

        expect(screen.getByRole('dialog', { name: 'More options' })).toHaveFocus();
    });

    it('closes on Escape', () => {
        const { onClose } = renderSheet();

        fireEvent.keyDown(screen.getByRole('dialog', { name: 'More options' }), { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('can be closed with the Close button on phones', () => {
        mocks.isMobile.mockReturnValue(true);
        const { onClose } = renderSheet();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
