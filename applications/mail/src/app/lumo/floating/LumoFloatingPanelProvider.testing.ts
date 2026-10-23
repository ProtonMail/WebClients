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
        setCardWidth: jest.fn(),
        detach: jest.fn(),
        dock: jest.fn(),
        toggleLumo: jest.fn(),
        closePanel: jest.fn(),
        switchSides: jest.fn(),
        isCatHidden: false,
        hideCat: jest.fn(),
        revealCat: jest.fn(),
        isCatDismissed: false,
        dismissCat: jest.fn(),
        ...overrides,
    };
};
