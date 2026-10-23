import { createRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useReducedMotion } from '@proton/components/hooks/useReducedMotion';
import ConnectedLumoPromptBar from '@proton/llm/lib/lumoAgent/ui/ConnectedLumoPromptBar';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

import { ResizeHandlePosition } from '../../components/list/ResizeHandle';
import CatSprite from '../pet/CatSprite';
import { CatPose } from '../pet/catPose';
import LumoFloatingPanel from './LumoFloatingPanel';
import { useLumoFloatingPanel } from './LumoFloatingPanelProvider';
import { buildLumoFloatingPanelValue } from './LumoFloatingPanelProvider.testing';
import { CARD_MIN_WIDTH, CARD_RESIZING_CLASS } from './cardResize';
import { PanelSide } from './panelSide';
import { useMailboxBounds } from './useMailboxBounds';

jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@proton/components/hooks/useReducedMotion', () => ({ useReducedMotion: jest.fn() }));
jest.mock('@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext', () => ({ useLumoAgentDrawer: jest.fn() }));
jest.mock('@proton/llm/lib/lumoAgent/ui/ConnectedLumoPromptBar', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));
jest.mock('@proton/shared/lib/helpers/dom', () => ({ rootFontSize: jest.fn() }));
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
const hideCat = jest.fn();
const revealCat = jest.fn();
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
    isCatHidden?: boolean;
    isCatDismissed?: boolean;
    isReducedMotion?: boolean;
    mailboxWidth?: number;
}

const mockPanel = ({
    isDetached = true,
    isPanelOpen = true,
    isSmallViewport = false,
    hasBounds = true,
    cardWidth = CARD_MIN_WIDTH,
    shownSide = PanelSide.LEFT,
    isCatHidden = false,
    isCatDismissed = false,
    isReducedMotion = false,
    mailboxWidth = MAILBOX_WIDTH,
}: Setup) => {
    jest.mocked(useLumoFloatingPanel).mockReturnValue(
        buildLumoFloatingPanelValue({
            isDetached,
            isPanelOpen,
            isCurrentSurfaceOpen: isPanelOpen,
            shownSide,
            cardWidth,
            setCardWidth,
            dock,
            toggleLumo,
            closePanel,
            switchSides,
            isCatHidden,
            hideCat,
            revealCat,
            isCatDismissed,
        })
    );
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
        hasBounds ? ({ top: 0, left: 0, width: mailboxWidth, height: 800 } as DOMRect) : null
    );
    jest.mocked(useReducedMotion).mockReturnValue(isReducedMotion);
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
const panelDock = (container: HTMLElement) => container.querySelector('.lumo-floating-panel-dock')!;
const catSlot = (container: HTMLElement) => container.querySelector('.lumo-pet-cat-slot')!;
const shownSprite = () => jest.mocked(CatSprite).mock.lastCall![0];
const isCatMirrored = () => shownSprite().isMirrored;
const RUNNING_CLASS = 'lumo-floating-panel--running';

// jsdom has no TransitionEvent, so the generic event it falls back to drops propertyName
const endTransition = (element: Element, propertyName: string) => {
    fireEvent(element, Object.assign(new Event('transitionend', { bubbles: true }), { propertyName }));
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(rootFontSize).mockReturnValue(16);
});

describe('LumoFloatingPanel', () => {
    it.each<[string, Setup]>([
        ['docked', { isDetached: false }],
        ['on a small viewport', { isSmallViewport: true }],
        ['the mailbox is unmeasured', { hasBounds: false }],
        ['the cat is dismissed', { isCatDismissed: true }],
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
        fireEvent.click(screen.getByRole('button', { name: 'Hide Lumo' }));

        expect(switchSides).toHaveBeenCalledTimes(1);
        expect(dock).toHaveBeenCalledTimes(1);
        expect(openDebugReport).toHaveBeenCalledTimes(1);
        expect(hideCat).toHaveBeenCalledTimes(1);
    });

    it('reveals the hidden cat from its ears', async () => {
        await renderPanel({ isPanelOpen: false, isCatHidden: true });

        fireEvent.click(screen.getByRole('button', { name: 'Show Lumo' }));

        expect(revealCat).toHaveBeenCalledTimes(1);
    });

    it('gallops the cat, card and prompt to the new side together, until the dock arrives', async () => {
        const { container, rerenderPanel } = await renderPanel({ shownSide: PanelSide.RIGHT });
        expect(overlay(container).style.getPropertyValue('--lumo-floating-panel-run-ms')).toBe(
            `${((MAILBOX_WIDTH - 16 - 16 - 96) / 600) * 1000}ms`
        );

        act(() => rerenderPanel({ shownSide: PanelSide.LEFT }));
        expect(overlay(container)).toHaveClass(RUNNING_CLASS);
        expect(isCatMirrored()).toBe(true);
        expect(overlay(container)).toHaveClass('lumo-floating-panel--left');

        endTransition(catSlot(container), 'transform');
        endTransition(panelDock(container), 'opacity');
        expect(overlay(container)).toHaveClass(RUNNING_CLASS);

        endTransition(panelDock(container), 'transform');
        expect(overlay(container)).not.toHaveClass(RUNNING_CLASS);
        expect(isCatMirrored()).toBe(false);
    });

    it('caps the run at 1.5s across a wide mailbox', async () => {
        const { container } = await renderPanel({ mailboxWidth: 2000 });

        expect(overlay(container).style.getPropertyValue('--lumo-floating-panel-run-ms')).toBe('1500ms');
    });

    it('measures the run in rem, so a larger font size shortens it', async () => {
        jest.mocked(rootFontSize).mockReturnValue(20);

        const { container } = await renderPanel({ hasFloatingDrawerButton: true });

        expect(overlay(container).style.getPropertyValue('--lumo-floating-panel-run-ms')).toBe(
            `${((MAILBOX_WIDTH - (1 + 1 + 6 + 2) * 20) / 600) * 1000}ms`
        );
    });

    it('moves straight to the new side with reduced motion', async () => {
        const { container, rerenderPanel } = await renderPanel({ isReducedMotion: true, shownSide: PanelSide.RIGHT });

        act(() => rerenderPanel({ shownSide: PanelSide.LEFT }));

        expect(overlay(container)).not.toHaveClass(RUNNING_CLASS);
        expect(overlay(container)).toHaveClass('lumo-floating-panel--left');
    });

    it('jumps the cat into hiding, then keeps it dropped once the jump ends', async () => {
        const { container, rerenderPanel } = await renderPanel();

        act(() => rerenderPanel({ isPanelOpen: false, isCatHidden: true }));
        expect(catSlot(container)).toHaveClass('lumo-pet-cat-slot--hidden', 'lumo-pet-cat-slot--jump-out');

        fireEvent.animationEnd(catSlot(container));
        expect(catSlot(container)).toHaveClass('lumo-pet-cat-slot--hidden');
        expect(catSlot(container)).not.toHaveClass('lumo-pet-cat-slot--jump-out');
    });

    it('drops the cat into hiding without a jump with reduced motion', async () => {
        const { container, rerenderPanel } = await renderPanel({ isReducedMotion: true });

        act(() => rerenderPanel({ isPanelOpen: false, isCatHidden: true }));

        expect(catSlot(container)).toHaveClass('lumo-pet-cat-slot--hidden');
        expect(catSlot(container)).not.toHaveClass('lumo-pet-cat-slot--jump-out');
    });

    it('does not run while docked, so a later detach shows a sitting cat', async () => {
        const { container, rerenderPanel } = await renderPanel({ isDetached: false, shownSide: PanelSide.RIGHT });

        act(() => rerenderPanel({ shownSide: PanelSide.LEFT }));
        act(() => rerenderPanel({ isDetached: true }));

        expect(overlay(container)).not.toHaveClass(RUNNING_CLASS);
        expect(container.querySelector('.lumo-pet-menu')).toBeInTheDocument();
    });

    it('has the cat watch the prompt while the user types in it', async () => {
        await renderPanel({ shownSide: PanelSide.RIGHT });
        expect(shownSprite().pose).toBe(CatPose.SIT);

        act(() => jest.mocked(ConnectedLumoPromptBar).mock.lastCall![0].onDraftChange!('archive the'));

        expect(shownSprite().pose).toBe(CatPose.WATCH_LEFT);
    });

    it('plays a trick phrase instead of sending it, mirrored to face the card on the left', async () => {
        await renderPanel({ shownSide: PanelSide.LEFT });
        const { interceptSend } = jest.mocked(ConnectedLumoPromptBar).mock.lastCall![0];

        let isIntercepted = false;
        act(() => {
            isIntercepted = interceptSend!('Nine lives!');
        });

        expect(isIntercepted).toBe(true);
        expect(shownSprite().pose).toBe(CatPose.NINE_LIVES);
        expect(isCatMirrored()).toBe(true);
    });

    it('lets any other message through to Lumo', async () => {
        await renderPanel();
        const { interceptSend } = jest.mocked(ConnectedLumoPromptBar).mock.lastCall![0];

        let isIntercepted = true;
        act(() => {
            isIntercepted = interceptSend!('archive the invoices');
        });

        expect(isIntercepted).toBe(false);
        expect(shownSprite().pose).toBe(CatPose.SIT);
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
