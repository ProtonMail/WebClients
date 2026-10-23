import type { ReactNode } from 'react';
import { useEffect, useReducer } from 'react';

import { act, renderHook } from '@testing-library/react';

import { defaultApiStatus } from '@proton/account/apiStatus';
import { buildUser } from '@proton/account/testing/buildUser';
import { useUser } from '@proton/account/user/hooks';
import useLumoInMail from '@proton/components/components/drawer/views/lumoAgent/useLumoInMail';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import useOnline from '@proton/components/hooks/useOnline';
import type { DrawerApp } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import { useMailSelector } from '../../store/hooks';
import { LumoFloatingPanelProvider, useHasLumoFloatingPanel, useLumoFloatingPanel } from './LumoFloatingPanelProvider';
import { PanelSide } from './panelSide';
import { useLumoHotkey } from './useLumoHotkey';

const SURFACE_MODE_KEY = 'lumo-mail-surface-mode-user-a';

const assistantOpened = jest.fn();
const toggleDrawer = jest.fn();
const toggleDrawerApp = jest.fn(() => toggleDrawer);

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/components/components/drawer/views/lumoAgent/useLumoInMail', () => {
    return { __esModule: true, default: jest.fn() };
});
jest.mock('@proton/components/hooks/drawer/useDrawer', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@proton/components/hooks/useApiStatus', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@proton/components/hooks/useOnline', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../store/hooks');
jest.mock('./useLumoHotkey', () => ({ useLumoHotkey: jest.fn() }));
jest.mock('../telemetry/useLumoMailTelemetry', () => ({
    useLumoMailTelemetry: () => ({ assistantOpened }),
}));

// The panel state lives in a memoised sibling that re-renders only from its own subscriptions, so a
// changed mock has to be delivered the same way rather than by re-rendering the provider.
const refreshers = new Set<() => void>();
const useRefreshable = () => {
    const [, refresh] = useReducer((count: number) => {
        return count + 1;
    }, 0);
    useEffect(() => {
        refreshers.add(refresh);
        return () => {
            refreshers.delete(refresh);
        };
    }, []);
};
const refresh = () => {
    act(() => {
        refreshers.forEach((refresher) => {
            refresher();
        });
    });
};

const setAppInView = (appInView: DrawerApp | undefined, showDrawerSidebar = true) => {
    jest.mocked(useDrawer).mockImplementation(() => {
        useRefreshable();
        return { appInView, toggleDrawerApp, showDrawerSidebar } as unknown as ReturnType<typeof useDrawer>;
    });
};
const setUserID = (ID: string) => {
    jest.mocked(useUser).mockReturnValue([buildUser({ ID }), false]);
};
const setComposersCount = (count: number) => {
    jest.mocked(useMailSelector).mockReturnValue(count);
};
const setReachability = ({ isApiOffline, isOnline }: { isApiOffline: boolean; isOnline: boolean }) => {
    jest.mocked(useApiStatus).mockReturnValue({ ...defaultApiStatus, offline: isApiOffline });
    jest.mocked(useOnline).mockReturnValue(isOnline);
};

interface Props {
    children: ReactNode;
}

const WhenPublished = ({ children }: Props) => {
    return useHasLumoFloatingPanel() ? children : null;
};

const Wrapper = ({ children }: Props) => {
    return (
        <LumoFloatingPanelProvider>
            <WhenPublished>{children}</WhenPublished>
        </LumoFloatingPanelProvider>
    );
};

const renderPanel = () => {
    return renderHook(useLumoFloatingPanel, { wrapper: Wrapper });
};

const renderDetached = () => {
    setAppInView(DRAWER_NATIVE_APPS.LUMO);
    const rendered = renderPanel();
    act(() => rendered.result.current.detach());
    setAppInView(undefined);
    refresh();
    jest.clearAllMocks();
    return rendered;
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useLumoInMail).mockReturnValue(true);
    window.localStorage.clear();
    setUserID('user-a');
    setAppInView(undefined);
    setComposersCount(0);
    setReachability({ isApiOffline: false, isOnline: true });
});

describe('LumoFloatingPanelProvider', () => {
    it('closes the drawer and opens the panel on detach without reporting an open', () => {
        setAppInView(DRAWER_NATIVE_APPS.LUMO);
        const { result } = renderPanel();

        act(() => result.current.detach());

        expect(toggleDrawerApp).toHaveBeenCalledWith({ app: DRAWER_NATIVE_APPS.LUMO });
        expect(toggleDrawer).toHaveBeenCalledTimes(1);
        expect(result.current.isDetached).toBe(true);
        expect(result.current.isPanelOpen).toBe(true);
        expect(assistantOpened).not.toHaveBeenCalled();
    });

    it('closes the panel and opens the drawer on dock without reporting an open', () => {
        const { result } = renderDetached();

        act(() => result.current.dock());

        expect(toggleDrawerApp).toHaveBeenCalledWith({ app: DRAWER_NATIVE_APPS.LUMO });
        expect(toggleDrawer).toHaveBeenCalledTimes(1);
        expect(result.current.isDetached).toBe(false);
        expect(result.current.isPanelOpen).toBe(false);
        expect(assistantOpened).not.toHaveBeenCalled();
    });

    it.each([
        ['the API is unreachable', { isApiOffline: true, isOnline: true }],
        ['the browser is offline', { isApiOffline: false, isOnline: false }],
    ])('keeps the panel up on dock when %s, since the drawer cannot open', (_, reachability) => {
        const { result } = renderDetached();
        setReachability(reachability);
        refresh();

        act(() => result.current.dock());

        expect(toggleDrawer).not.toHaveBeenCalled();
        expect(result.current.isDetached).toBe(true);
        expect(result.current.isPanelOpen).toBe(true);
    });

    it('opens the drawer while docked and reports the open once', () => {
        const { result } = renderPanel();

        act(() => result.current.toggleLumo());

        expect(toggleDrawer).toHaveBeenCalledTimes(1);
        expect(assistantOpened).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['the API is unreachable', { isApiOffline: true, isOnline: true }],
        ['the browser is offline', { isApiOffline: false, isOnline: false }],
    ])('neither opens the drawer nor reports an open while docked when %s', (_, reachability) => {
        setReachability(reachability);
        const { result } = renderPanel();

        act(() => result.current.toggleLumo());

        expect(toggleDrawer).not.toHaveBeenCalled();
        expect(assistantOpened).not.toHaveBeenCalled();
    });

    it('closes the drawer while docked without reporting an open', () => {
        setAppInView(DRAWER_NATIVE_APPS.LUMO);
        const { result } = renderPanel();
        expect(result.current.isCurrentSurfaceOpen).toBe(true);

        act(() => result.current.toggleLumo());

        expect(toggleDrawer).toHaveBeenCalledTimes(1);
        expect(assistantOpened).not.toHaveBeenCalled();
    });

    it('closes and reopens the panel while detached, reporting only the open', () => {
        const { result } = renderDetached();

        act(() => result.current.toggleLumo());
        expect(result.current.isPanelOpen).toBe(false);
        expect(assistantOpened).not.toHaveBeenCalled();

        act(() => result.current.toggleLumo());
        expect(result.current.isPanelOpen).toBe(true);
        expect(assistantOpened).toHaveBeenCalledTimes(1);
        expect(toggleDrawer).not.toHaveBeenCalled();
    });

    it('hands the hotkey the current surface state and its opener', () => {
        const { result } = renderDetached();
        refresh();
        expect(jest.mocked(useLumoHotkey).mock.lastCall![0].isCurrentSurfaceOpen).toBe(true);
        act(() => result.current.closePanel());

        const { isCurrentSurfaceOpen, openLumo } = jest.mocked(useLumoHotkey).mock.lastCall![0];
        expect(isCurrentSurfaceOpen).toBe(false);

        act(() => openLumo());
        expect(result.current.isPanelOpen).toBe(true);
        expect(assistantOpened).toHaveBeenCalledTimes(1);
    });

    it('moves to the left while a composer is open and back once none are', () => {
        const { result } = renderPanel();

        setComposersCount(1);
        refresh();
        expect(result.current.shownSide).toBe(PanelSide.LEFT);

        setComposersCount(0);
        refresh();
        expect(result.current.shownSide).toBe(PanelSide.RIGHT);
    });

    it('closes the panel and hides the cat on hide, and shows it again on reveal', () => {
        const { result } = renderDetached();
        expect(result.current.isCatHidden).toBe(false);

        act(() => result.current.hideCat());
        expect(result.current.isPanelOpen).toBe(false);
        expect(result.current.isCatHidden).toBe(true);

        act(() => result.current.revealCat());
        expect(result.current.isCatHidden).toBe(false);
        expect(result.current.isPanelOpen).toBe(false);
    });

    it('opens the panel and reveals the hidden cat on toggle while detached', () => {
        const { result } = renderDetached();
        act(() => result.current.hideCat());

        act(() => result.current.toggleLumo());

        expect(result.current.isPanelOpen).toBe(true);
        expect(result.current.isCatHidden).toBe(false);
    });

    it('reveals the hidden cat when the hotkey opens the panel', () => {
        const { result } = renderDetached();
        act(() => result.current.hideCat());

        const { openLumo } = jest.mocked(useLumoHotkey).mock.lastCall![0];
        act(() => openLumo());

        expect(result.current.isPanelOpen).toBe(true);
        expect(result.current.isCatHidden).toBe(false);
    });

    it('reveals the hidden cat on a fresh detach after a dock', () => {
        const { result } = renderDetached();
        act(() => result.current.hideCat());
        act(() => result.current.dock());
        expect(result.current.isCatHidden).toBe(true);

        act(() => result.current.detach());

        expect(result.current.isDetached).toBe(true);
        expect(result.current.isCatHidden).toBe(false);
    });

    it('publishes nothing while Lumo is off and the remembered mode, closed, once it is back on', () => {
        const seenDetached: boolean[] = [];
        const { result, rerender } = renderHook(
            () => {
                const panel = useLumoFloatingPanel();
                seenDetached.push(panel.isDetached);
                return panel;
            },
            { wrapper: Wrapper }
        );
        act(() => result.current.detach());
        expect(result.current.isDetached).toBe(true);

        seenDetached.length = 0;
        jest.mocked(useLumoInMail).mockReturnValue(false);
        rerender();
        expect(seenDetached).toEqual([]);

        jest.mocked(useLumoInMail).mockReturnValue(true);
        rerender();
        expect(result.current.isDetached).toBe(true);
        expect(result.current.isPanelOpen).toBe(false);
    });

    it('starts docked when no mode is remembered', () => {
        const { result } = renderPanel();

        expect(result.current.isDetached).toBe(false);
    });

    it('restores a remembered detached mode closed, with the cat shown and no open reported', () => {
        window.localStorage.setItem(SURFACE_MODE_KEY, 'true');

        const { result } = renderPanel();

        expect(result.current.isDetached).toBe(true);
        expect(result.current.isPanelOpen).toBe(false);
        expect(result.current.isCatHidden).toBe(false);
        expect(result.current.isCurrentSurfaceOpen).toBe(false);
        expect(toggleDrawer).not.toHaveBeenCalled();
        expect(assistantOpened).not.toHaveBeenCalled();
    });

    it('starts docked when the remembered mode is unrecognised', () => {
        window.localStorage.setItem(SURFACE_MODE_KEY, 'banana');

        const { result } = renderPanel();

        expect(result.current.isDetached).toBe(false);
    });

    it("ignores another user's remembered mode", () => {
        setUserID('user-b');
        const otherUser = renderPanel();
        act(() => {
            otherUser.result.current.detach();
        });
        otherUser.unmount();
        setUserID('user-a');

        const { result } = renderPanel();

        expect(result.current.isDetached).toBe(false);
    });

    it('remembers the detached mode on detach', () => {
        const { result } = renderPanel();

        act(() => {
            result.current.detach();
        });

        expect(window.localStorage.getItem(SURFACE_MODE_KEY)).toBe('true');
    });

    it('remembers the docked mode on dock', () => {
        const { result } = renderDetached();

        act(() => {
            result.current.dock();
        });

        expect(window.localStorage.getItem(SURFACE_MODE_KEY)).toBe('false');
    });

    it('keeps the remembered detached mode when a dock is refused offline', () => {
        const { result } = renderDetached();
        setReachability({ isApiOffline: false, isOnline: false });
        refresh();

        act(() => {
            result.current.dock();
        });

        expect(window.localStorage.getItem(SURFACE_MODE_KEY)).toBe('true');
    });

    it('closes the panel and takes the cat off screen on dismiss', () => {
        const { result } = renderDetached();

        act(() => result.current.dismissCat());

        expect(result.current.isPanelOpen).toBe(false);
        expect(result.current.isCatDismissed).toBe(true);
    });

    it('brings the dismissed cat back with the panel open on toggle', () => {
        const { result } = renderDetached();
        act(() => result.current.hideCat());
        act(() => result.current.dismissCat());

        act(() => result.current.toggleLumo());

        expect(result.current.isPanelOpen).toBe(true);
        expect(result.current.isCatDismissed).toBe(false);
        expect(result.current.isCatHidden).toBe(false);
    });

    it('brings the dismissed cat back on a fresh detach after a dock', () => {
        const { result } = renderDetached();
        act(() => result.current.dismissCat());
        act(() => result.current.dock());

        act(() => result.current.detach());

        expect(result.current.isCatDismissed).toBe(false);
    });

    it('brings the dismissed cat back when the Drawer sidebar is hidden', () => {
        const { result } = renderDetached();
        act(() => result.current.dismissCat());

        setAppInView(undefined, false);
        refresh();

        expect(result.current.isCatDismissed).toBe(false);
        expect(result.current.isPanelOpen).toBe(false);
    });

    it('switches sides on request', () => {
        const { result } = renderPanel();

        act(() => result.current.switchSides());

        expect(result.current.shownSide).toBe(PanelSide.LEFT);
    });
});
