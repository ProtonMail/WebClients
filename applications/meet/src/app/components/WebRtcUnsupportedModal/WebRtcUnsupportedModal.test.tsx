import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WebRtcUnsupportedModal } from './WebRtcUnsupportedModal';

const mocks = vi.hoisted(() => ({
    isFirefox: vi.fn(() => false),
}));

vi.mock('@proton/shared/lib/helpers/browser', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    isFirefox: mocks.isFirefox,
}));

beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

const generalAdvice =
    'Proton Meet needs WebRTC, which is off or blocked in this browser. Turn it on, turn off extensions that block it, or use another browser.';
const firefoxAdvice = 'In Firefox, open about:config and set media.peerconnection.enabled to true.';

describe('WebRtcUnsupportedModal', () => {
    it('names the dialog by its title and describes it with the general advice outside Firefox', () => {
        mocks.isFirefox.mockReturnValue(false);
        render(<WebRtcUnsupportedModal onClose={vi.fn()} />);

        const dialog = screen.getByRole('dialog', { name: 'Browser not supported' });

        expect(dialog).toHaveAccessibleDescription(generalAdvice);
        expect(within(dialog).queryByText(/about:config/)).not.toBeInTheDocument();
    });

    it('adds the Firefox setting to the description, with the technical values in bold, on Firefox', () => {
        mocks.isFirefox.mockReturnValue(true);
        render(<WebRtcUnsupportedModal onClose={vi.fn()} />);

        const dialog = screen.getByRole('dialog', { name: 'Browser not supported' });

        expect(dialog).toHaveAccessibleDescription(
            expect.stringContaining(
                `${generalAdvice} In Firefox, open about:config and set media.peerconnection.enabled to true`
            )
        );
        const strongElements = within(dialog).getAllByRole('strong');
        expect(strongElements.map((element) => element.textContent)).toEqual([
            'about:config',
            'media.peerconnection.enabled',
            'true',
        ]);
        expect(strongElements[0].parentElement).toHaveTextContent(firefoxAdvice);
    });

    it('offers a single Close action in the secondary style that calls onClose once', async () => {
        mocks.isFirefox.mockReturnValue(false);
        const onClose = vi.fn();
        render(<WebRtcUnsupportedModal onClose={onClose} />);

        const dialog = screen.getByRole('dialog', { name: 'Browser not supported' });
        const closeAction = within(dialog).getByRole('button', { name: 'Close' });

        expect(within(dialog).getAllByRole('button')).toEqual([closeAction]);
        expect(closeAction).toHaveClass('secondary');

        await userEvent.click(closeAction);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose once on Escape', async () => {
        mocks.isFirefox.mockReturnValue(false);
        const onClose = vi.fn();
        render(<WebRtcUnsupportedModal onClose={onClose} />);

        await userEvent.keyboard('{Escape}');

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
