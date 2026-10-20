import { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';

import { ResizeHandlePosition } from '../../components/list/ResizeHandle';
import LumoFloatingPanel from './LumoFloatingPanel';
import { useLumoFloatingPanel } from './LumoFloatingPanelProvider';
import { CARD_MIN_WIDTH, CARD_RESIZING_CLASS } from './cardResize';
import { PanelSide } from './panelSide';
import { useMailboxBounds } from './useMailboxBounds';

jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext', () => ({ useLumoAgentDrawer: jest.fn() }));
jest.mock('@proton/llm/lib/lumoAgent/ui/ConnectedLumoPromptBar', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));
jest.mock('../pet/CatSprite', () => ({ __esModule: true, default: jest.fn(() => null) }));
jest.mock('./LumoFloatingPanelCard', () => ({ __esModule: true, default: () => null }));
jest.mock('./LumoFloatingPanelProvider', () => ({ useLumoFloatingPanel: jest.fn() }));
jest.mock('./useMailboxBounds', () => ({ useMailboxBounds: jest.fn() }));

const MAILBOX_WIDTH = 1000;
const WIDEST_CARD = MAILBOX_WIDTH * 0.6;

const setCardWidth = jest.fn();
const toggleLumo = jest.fn();
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
    shownSide?: PanelSide;
    hasFloatingDrawerButton?: boolean;
}

const mockPanel = ({
    isDetached = true,
    isPanelOpen = true,
    isSmallViewport = false,
    hasBounds = true,
    cardWidth = CARD_MIN_WIDTH,
    shownSide = PanelSide.LEFT,
}: Setup) => {
    jest.mocked(useLumoFloatingPanel).mockReturnValue({
        isDetached,
        isPanelOpen,
        isCurrentSurfaceOpen: isPanelOpen,
        shownSide,
        cardWidth,
        setCardWidth,
        detach: jest.fn(),
        dock,
        toggleLumo,
        closePanel,
        switchSides,
    });
    jest.mocked(useLumoAgentDrawer).mockReturnValue({
        items: [],
        isBusy: false,
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
};

const renderPanel = async (setup: Setup = {}) => {
    mockPanel(setup);
    const panel = () => (
        <LumoFloatingPanel mainAreaRef={createRef()} hasFloatingDrawerButton={setup.hasFloatingDrawerButton ?? false} />
    );
    const rendered = await act(() => render(panel()));
    let currentSetup = setup;
    const rerenderPanel = (nextSetup: Setup) => {
        currentSetup = { ...currentSetup, ...nextSetup };
        mockPanel(currentSetup);
        rendered.rerender(panel());
    };
    return { ...rendered, rerenderPanel };
};

const resizeGrip = () => screen.getByRole('button', { name: 'Resize panel' });
const cat = () => screen.queryByRole('button', { name: 'Toggle Lumo' });
const chat = () => document.getElementById('drawer-app-lumo');
const overlay = (container: HTMLElement) => container.firstChild as HTMLElement;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('LumoFloatingPanel', () => {
    it.each<[string, Setup]>([
        ['docked', { isDetached: false }],
        ['on a small viewport', { isSmallViewport: true }],
        ['the mailbox is unmeasured', { hasBounds: false }],
    ])('renders nothing while %s', async (_, setup) => {
        const { container } = await renderPanel(setup);

        expect(container).toBeEmptyDOMElement();
    });

    it('keeps the cat in the corner while the card is closed', async () => {
        await renderPanel({ isPanelOpen: false });

        expect(cat()).toBeInTheDocument();
        expect(chat()).not.toBeInTheDocument();
    });

    it('shows the card beside the cat while it is open', async () => {
        await renderPanel();

        expect(cat()).toBeInTheDocument();
        expect(chat()).toBeInTheDocument();
    });

    it('toggles the card from the cat', async () => {
        await renderPanel({ isPanelOpen: false });

        fireEvent.click(cat()!);

        expect(toggleLumo).toHaveBeenCalledTimes(1);
    });

    it('sends each cat menu action to the panel and the conversation', async () => {
        await renderPanel();

        fireEvent.click(screen.getByRole('button', { name: 'Move Lumo to the right' }));
        fireEvent.click(screen.getByRole('button', { name: 'Dock to side panel' }));
        fireEvent.click(screen.getByRole('button', { name: 'Report a problem' }));

        expect(switchSides).toHaveBeenCalledTimes(1);
        expect(dock).toHaveBeenCalledTimes(1);
        expect(openDebugReport).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['opens the closed card', false, 1],
        ['keeps the open card as it is', true, 0],
    ])('clears the conversation on New chat and %s', async (_, isPanelOpen, toggleCount) => {
        await renderPanel({ isPanelOpen });

        fireEvent.click(screen.getByRole('button', { name: 'New chat' }));

        expect(clear).toHaveBeenCalledTimes(1);
        expect(toggleLumo).toHaveBeenCalledTimes(toggleCount);
    });

    it.each([
        [PanelSide.RIGHT, false],
        [PanelSide.RIGHT, true],
        [PanelSide.LEFT, false],
        [PanelSide.LEFT, true],
    ])(
        'on the %s, with a floating drawer button %s, hands the side, clearance and mailbox width to the stylesheet',
        async (shownSide, hasFloatingDrawerButton) => {
            const { container } = await renderPanel({ shownSide, hasFloatingDrawerButton });

            expect(overlay(container)).toHaveClass(`lumo-floating-panel--${shownSide}`);
            expect(overlay(container).classList.contains('lumo-floating-panel--drawer-button-clearance')).toBe(
                hasFloatingDrawerButton
            );
            expect(overlay(container).style.getPropertyValue('--lumo-floating-panel-width')).toBe(`${MAILBOX_WIDTH}px`);
        }
    );

    it.each([
        [PanelSide.RIGHT, ResizeHandlePosition.LEFT],
        [PanelSide.LEFT, ResizeHandlePosition.RIGHT],
    ])('puts the grip on the inner edge on the %s', async (shownSide, gripPosition) => {
        await renderPanel({ shownSide });

        expect(resizeGrip()).toHaveAttribute('data-position', gripPosition);
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
