import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { ArtifactPanelHostProvider, useArtifactPanelHostActions } from '../../../providers/ArtifactPanelHostProvider';
import { RightPanelProvider, useRightPanel } from '../../../providers/RightPanelProvider';
import { setNativeRightPanelWidth } from '../../../remote/nativeComposerBridgeHelpers';
import { canUseNativeRightPanelLayout } from '../../../util/userAgent';
import { useNativeRightPanelLayoutApi } from './useNativeRightPanelLayoutApi';

vi.mock('@proton/components/hooks/useActiveBreakpoint', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('../../../hooks/useIsLumoSmallScreen');
vi.mock('../../../remote/nativeComposerBridgeHelpers');
vi.mock('../../../util/userAgent');

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RightPanelProvider>
        <ArtifactPanelHostProvider>{children}</ArtifactPanelHostProvider>
    </RightPanelProvider>
);

const originalObserver = global.ResizeObserver;
const originalViewportWidth = window.innerWidth;
let resize: ResizeObserverCallback;
let observer: ResizeObserver;
const disconnect = vi.fn();

describe('useNativeRightPanelLayoutApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useIsLumoSmallScreen as Mock).mockReturnValue({ isSmallScreen: false });
        (canUseNativeRightPanelLayout as Mock).mockReturnValue(true);
        window.innerWidth = 1024;
        vi.spyOn(document.documentElement, 'clientWidth', 'get').mockImplementation(() => window.innerWidth);
        global.ResizeObserver = vi.fn().mockImplementation(function (callback: ResizeObserverCallback) {
            resize = callback;
            observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect };
            return observer;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        global.ResizeObserver = originalObserver;
        window.innerWidth = originalViewportWidth;
        document.body.replaceChildren();
    });

    it('reserves the measured space to the right of chat when a docked drawer opens', () => {
        const chat = document.createElement('main');
        vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
        const chatRef = { current: chat };
        const { result } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );

        act(() => result.current.open());

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(400);
    });
    it.each([
        {
            event: 'window resize',
            trigger: () => {
                window.dispatchEvent(new Event('resize'));
            },
        },
        {
            event: 'chat resize',
            trigger: () => {
                resize([], observer);
            },
        },
    ])('updates the reservation after $event', ({ trigger }) => {
        const chat = document.createElement('main');
        const bounds = vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
        const chatRef = { current: chat };
        const { result } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );
        act(() => result.current.open());

        bounds.mockReturnValue(new DOMRect(0, 0, 524, 800));
        act(trigger);

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(500);
    });

    it('reserves space when an artifact is docked without the files drawer', () => {
        const chat = document.createElement('main');
        vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
        const chatRef = { current: chat };
        const { result } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useArtifactPanelHostActions();
            },
            { wrapper }
        );

        act(() => result.current.setHostVisible(true));

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(400);
    });

    it('clears reserved space for a compact overlay', () => {
        (useIsLumoSmallScreen as Mock).mockReturnValue({ isSmallScreen: true });
        const chat = document.createElement('main');
        vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
        const chatRef = { current: chat };
        const { result } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );

        act(() => result.current.open());

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(0);
    });

    it('clears the last docked reservation when leaving the layout', () => {
        const chat = document.createElement('main');
        vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
        const chatRef = { current: chat };
        const { result, unmount } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );
        act(() => result.current.open());

        unmount();

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(0);
    });

    it('never sends the optional geometry to unsupported clients, including on unmount', () => {
        (canUseNativeRightPanelLayout as Mock).mockReturnValue(false);
        const chatRef = { current: document.createElement('main') };
        const { result, unmount } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );
        act(() => result.current.open());

        unmount();

        expect(setNativeRightPanelWidth).not.toHaveBeenCalled();
    });

    it('clears reserved space when the docked drawer closes', () => {
        const chat = document.createElement('main');
        vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
        const chatRef = { current: chat };
        const { result } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );
        act(() => result.current.open());

        act(() => result.current.close());

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(0);
        expect(disconnect).toHaveBeenCalled();
    });
    it('measures the trailing panel on the left in an RTL layout', () => {
        // In the document: a detached element has no computed direction.
        const chat = document.body.appendChild(document.createElement('main'));
        chat.style.direction = 'rtl';
        vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(400, 0, 624, 800));
        const chatRef = { current: chat };
        const { result } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );

        act(() => result.current.open());

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(400);
    });

    it('remeasures the viewport when chat keeps the same size after unfolding', () => {
        const observed = new Set<Element>();
        global.ResizeObserver = vi.fn().mockImplementation(function (callback: ResizeObserverCallback) {
            resize = callback;
            observer = {
                observe: (target: Element) => observed.add(target),
                unobserve: vi.fn(),
                disconnect,
            };
            return observer;
        });
        const chat = document.createElement('main');
        vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(8, 0, 451, 700));
        const chatRef = { current: chat };
        const { result } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );
        act(() => result.current.open());

        window.innerWidth = 466;
        act(() => window.dispatchEvent(new Event('resize')));
        // Only the root changes size: the docked chat happens to stay 451 points wide.
        window.innerWidth = 867;
        act(() => {
            if (observed.has(document.documentElement)) {
                resize([], observer);
            }
        });

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(408);
    });

    it('measures against the layout viewport while WebKit innerWidth still describes the closed display', () => {
        const chat = document.createElement('main');
        vi.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(8, 0, 451, 700));
        window.innerWidth = 382;
        vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(867);
        const chatRef = { current: chat };
        const { result } = renderHook(
            () => {
                useNativeRightPanelLayoutApi(chatRef);
                return useRightPanel();
            },
            { wrapper }
        );

        act(() => result.current.open());

        expect(setNativeRightPanelWidth).toHaveBeenLastCalledWith(408);
    });
});
