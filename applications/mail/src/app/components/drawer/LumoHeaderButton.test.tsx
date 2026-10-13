import { fireEvent, render, screen } from '@testing-library/react';

import { useLumoFloatingPanel } from '../../lumo/floating/LumoFloatingPanelProvider';
import { CARD_MIN_WIDTH } from '../../lumo/floating/cardResize';
import { PanelSide } from '../../lumo/floating/panelSide';
import LumoHeaderButton from './LumoHeaderButton';

jest.mock('../../lumo/floating/LumoFloatingPanelProvider', () => ({ useLumoFloatingPanel: jest.fn() }));

const toggleLumo = jest.fn();

describe('LumoHeaderButton', () => {
    it('toggles the current Lumo surface and reports whether it is open', () => {
        jest.mocked(useLumoFloatingPanel).mockReturnValue({
            isDetached: false,
            isPanelOpen: false,
            isCurrentSurfaceOpen: true,
            shownSide: PanelSide.RIGHT,
            cardWidth: CARD_MIN_WIDTH,
            setCardWidth: jest.fn(),
            detach: jest.fn(),
            dock: jest.fn(),
            toggleLumo,
            closePanel: jest.fn(),
            switchSides: jest.fn(),
        });
        render(<LumoHeaderButton />);
        const button = screen.getByTestId('lumo-drawer-app-button:lumo-icon');

        fireEvent.click(button);

        expect(toggleLumo).toHaveBeenCalledTimes(1);
        expect(button).toHaveAttribute('aria-expanded', 'true');
    });
});
