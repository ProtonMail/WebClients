import type { LumoFloatingPanelValue } from './LumoFloatingPanelProvider';
import { CARD_MIN_WIDTH } from './cardResize';
import { PanelSide } from './panelSide';

export const buildLumoFloatingPanelValue = (
    overrides: Partial<LumoFloatingPanelValue> = {}
): LumoFloatingPanelValue => {
    return {
        isDetached: false,
        isPanelOpen: false,
        isCurrentSurfaceOpen: false,
        shownSide: PanelSide.RIGHT,
        cardWidth: CARD_MIN_WIDTH,
        setCardWidth: vi.fn(),
        detach: vi.fn(),
        dock: vi.fn(),
        toggleLumo: vi.fn(),
        closePanel: vi.fn(),
        switchSides: vi.fn(),
        isCatHidden: false,
        hideCat: vi.fn(),
        revealCat: vi.fn(),
        isCatDismissed: false,
        dismissCat: vi.fn(),
        ...overrides,
    };
};
