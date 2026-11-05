import { act, renderHook } from '@testing-library/react';

import { useIsLumoSmallScreen } from '../../../hooks/useIsLumoSmallScreen';
import { ArtifactPanelHostProvider, useArtifactPanelHostActions } from '../../../providers/ArtifactPanelHostProvider';
import { RightPanelProvider, useRightPanel } from '../../../providers/RightPanelProvider';
import { setNativeRightPanelWidth } from '../../../remote/nativeComposerBridgeHelpers';
import { canUseNativeRightPanelLayout } from '../../../util/userAgent';
import { useNativeRightPanelLayoutApi } from './useNativeRightPanelLayoutApi';

jest.mock('@proton/components/hooks/useActiveBreakpoint', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../hooks/useIsLumoSmallScreen');
jest.mock('../../../remote/nativeComposerBridgeHelpers');
jest.mock('../../../util/userAgent');

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RightPanelProvider>
        <ArtifactPanelHostProvider>{children}</ArtifactPanelHostProvider>
    </RightPanelProvider>
);

const originalObserver = global.ResizeObserver;
const originalViewportWidth = window.innerWidth;
let resize: ResizeObserverCallback;
let observer: ResizeObserver;
const disconnect = jest.fn();

describe('useNativeRightPanelLayoutApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useIsLumoSmallScreen as jest.Mock).mockReturnValue({ isSmallScreen: false });
        (canUseNativeRightPanelLayout as jest.Mock).mockReturnValue(true);
        window.innerWidth = 1024;
        global.ResizeObserver = jest.fn().mockImplementation((callback: ResizeObserverCallback) => {
            resize = callback;
            observer = { observe: jest.fn(), unobserve: jest.fn(), disconnect };
            return observer;
        });
    });

    afterEach(() => {
        global.ResizeObserver = originalObserver;
        window.innerWidth = originalViewportWidth;
    });

    it('reserves the measured space to the right of chat when a docked drawer opens', () => {
        const chat = document.createElement('main');
        jest.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
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
        const bounds = jest.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
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
        jest.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
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
        (useIsLumoSmallScreen as jest.Mock).mockReturnValue({ isSmallScreen: true });
        const chat = document.createElement('main');
        jest.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
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
        jest.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
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
        (canUseNativeRightPanelLayout as jest.Mock).mockReturnValue(false);
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
        jest.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 624, 800));
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
        const chat = document.createElement('main');
        chat.style.direction = 'rtl';
        jest.spyOn(chat, 'getBoundingClientRect').mockReturnValue(new DOMRect(400, 0, 624, 800));
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
});
