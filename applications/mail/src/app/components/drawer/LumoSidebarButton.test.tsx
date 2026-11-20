import { fireEvent, render, screen } from '@testing-library/react';

import { useLumoFloatingPanel } from '../../lumo/floating/LumoFloatingPanelProvider';
import { buildLumoFloatingPanelValue } from '../../lumo/floating/LumoFloatingPanelProvider.testing';
import LumoSidebarButton from './LumoSidebarButton';

vi.mock('../../lumo/floating/LumoFloatingPanelProvider', () => ({ useLumoFloatingPanel: vi.fn() }));

const toggleLumo = vi.fn();
const dismissCat = vi.fn();

interface Setup {
    isDetached?: boolean;
    isCurrentSurfaceOpen?: boolean;
    isCatHidden?: boolean;
    isCatDismissed?: boolean;
}

const mockPanel = ({
    isDetached = false,
    isCurrentSurfaceOpen = false,
    isCatHidden = false,
    isCatDismissed = false,
}: Setup) => {
    vi.mocked(useLumoFloatingPanel).mockReturnValue(
        buildLumoFloatingPanelValue({
            isDetached,
            isPanelOpen: isDetached && isCurrentSurfaceOpen,
            isCurrentSurfaceOpen,
            toggleLumo,
            isCatHidden,
            isCatDismissed,
            dismissCat,
        })
    );
};

const renderButton = (setup: Setup) => {
    mockPanel(setup);
    render(<LumoSidebarButton />);
    return screen.getByTestId('lumo-drawer-app-button:lumo-icon');
};

describe('LumoSidebarButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each([true, false])('toggles the drawer tab while docked, reporting it open: %s', (isCurrentSurfaceOpen) => {
        const button = renderButton({ isCurrentSurfaceOpen });

        fireEvent.click(button);

        expect(toggleLumo).toHaveBeenCalledTimes(1);
        expect(dismissCat).not.toHaveBeenCalled();
        expect(button).toHaveAttribute('aria-expanded', String(isCurrentSurfaceOpen));
    });

    it.each<[string, Setup]>([
        ['the card is open', { isCurrentSurfaceOpen: true }],
        ['only the cat is shown', {}],
        ['only the ears are shown', { isCatHidden: true }],
    ])('takes Lumo off screen while detached and %s', (_, setup) => {
        const button = renderButton({ isDetached: true, ...setup });
        expect(button).toHaveAttribute('aria-expanded', 'true');

        fireEvent.click(button);

        expect(dismissCat).toHaveBeenCalledTimes(1);
        expect(toggleLumo).not.toHaveBeenCalled();
    });

    it('opens Lumo again while detached and the cat is off screen', () => {
        const button = renderButton({ isDetached: true, isCatDismissed: true });
        expect(button).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(button);

        expect(toggleLumo).toHaveBeenCalledTimes(1);
        expect(dismissCat).not.toHaveBeenCalled();
    });
});
