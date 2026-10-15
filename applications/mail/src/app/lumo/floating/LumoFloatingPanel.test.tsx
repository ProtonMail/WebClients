import { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';

import LumoFloatingPanel from './LumoFloatingPanel';
import LumoFloatingPanelMenu from './LumoFloatingPanelMenu';
import { useLumoFloatingPanel } from './LumoFloatingPanelProvider';
import { CARD_MIN_WIDTH, CARD_RESIZING_CLASS } from './cardResize';
import { PanelSide } from './panelSide';
import { useMailboxBounds } from './useMailboxBounds';

jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext', () => ({ useLumoAgentDrawer: jest.fn() }));
jest.mock('@proton/llm/lib/lumoAgent/ui/ConnectedLumoPromptBar', () => ({ __esModule: true, default: () => null }));
jest.mock('./LumoFloatingPanelCard', () => ({ __esModule: true, default: () => null }));
jest.mock('./LumoFloatingPanelMenu', () => ({ __esModule: true, default: jest.fn(() => null) }));
jest.mock('./LumoFloatingPanelProvider', () => ({ useLumoFloatingPanel: jest.fn() }));
jest.mock('./useMailboxBounds', () => ({ useMailboxBounds: jest.fn() }));

const MAILBOX_WIDTH = 1000;
const WIDEST_CARD = MAILBOX_WIDTH * 0.6;

const setCardWidth = jest.fn();
const closePanel = jest.fn();
const switchSides = jest.fn();
const dock = jest.fn();
const clear = jest.fn();
const openDebugReport = jest.fn();

interface Setup {
    isDetached?: boolean;
    isPanelOpen?: boolean;
    isSmallViewport?: boolean;
    hasBounds?: boolean;
    cardWidth?: number;
}

const renderPanel = async ({
    isDetached = true,
    isPanelOpen = true,
    isSmallViewport = false,
    hasBounds = true,
    cardWidth = CARD_MIN_WIDTH,
}: Setup = {}) => {
    jest.mocked(useLumoFloatingPanel).mockReturnValue({
        isDetached,
        isPanelOpen,
        isCurrentSurfaceOpen: isPanelOpen,
        shownSide: PanelSide.LEFT,
        cardWidth,
        setCardWidth,
        detach: jest.fn(),
        dock,
        toggleLumo: jest.fn(),
        closePanel,
        switchSides,
    });
    jest.mocked(useLumoAgentDrawer).mockReturnValue({
        hasConversation: true,
        clear,
        openDebugReport,
    } as unknown as ReturnType<typeof useLumoAgentDrawer>);
    jest.mocked(useActiveBreakpoint).mockReturnValue({
        viewportWidth: { '<=small': isSmallViewport },
    } as unknown as ReturnType<typeof useActiveBreakpoint>);
    jest.mocked(useMailboxBounds).mockReturnValue(
        hasBounds ? ({ top: 0, left: 0, width: MAILBOX_WIDTH, height: 800 } as DOMRect) : null
    );
    return act(() => render(<LumoFloatingPanel mainAreaRef={createRef()} hasFloatingDrawerButton={false} />));
};

const resizeGrip = () => screen.getByRole('button', { name: 'Resize panel' });

beforeEach(() => jest.clearAllMocks());

describe('LumoFloatingPanel', () => {
    it.each<[string, Setup]>([
        ['docked', { isDetached: false }],
        ['closed', { isPanelOpen: false }],
        ['on a small viewport', { isSmallViewport: true }],
        ['the mailbox is unmeasured', { hasBounds: false }],
    ])('renders nothing while %s', async (_, setup) => {
        const { container } = await renderPanel(setup);

        expect(container).toBeEmptyDOMElement();
    });

    it('wires each menu chip to its own action', async () => {
        await renderPanel();

        expect(jest.mocked(LumoFloatingPanelMenu).mock.lastCall![0]).toEqual({
            side: PanelSide.LEFT,
            hasConversation: true,
            onReportProblem: openDebugReport,
            onNewChat: clear,
            onSwitchSides: switchSides,
            onDock: dock,
        });
    });

    it('shows a stored width no wider than the current mailbox allows', async () => {
        const { container } = await renderPanel({ cardWidth: 900 });

        expect((container.firstChild as HTMLElement).style.getPropertyValue('--lumo-floating-panel-card-width')).toBe(
            `${WIDEST_CARD}px`
        );
    });

    it('stores a width dragged from the left-side grip, clamped to the mailbox', async () => {
        await renderPanel();

        fireEvent.mouseDown(resizeGrip(), { clientX: 0 });
        fireEvent.mouseMove(document, { clientX: 900 });
        fireEvent.mouseUp(document);

        expect(setCardWidth).toHaveBeenLastCalledWith(WIDEST_CARD);
    });

    it('ends a held drag when the panel closes mid-drag', async () => {
        const { rerender } = await renderPanel();
        fireEvent.mouseDown(resizeGrip(), { clientX: 0 });

        jest.mocked(useLumoFloatingPanel).mockReturnValue({
            ...jest.mocked(useLumoFloatingPanel).mock.results[0].value,
            isPanelOpen: false,
        });
        rerender(<LumoFloatingPanel mainAreaRef={createRef()} hasFloatingDrawerButton={false} />);
        fireEvent.mouseMove(document, { clientX: 900 });

        expect(setCardWidth).not.toHaveBeenCalled();
        expect(document.body).not.toHaveClass(CARD_RESIZING_CLASS);
    });

    it('resets the width to the default on double-click', async () => {
        await renderPanel({ cardWidth: 500 });

        fireEvent.doubleClick(resizeGrip());

        expect(setCardWidth).toHaveBeenCalledWith(CARD_MIN_WIDTH);
    });
});
