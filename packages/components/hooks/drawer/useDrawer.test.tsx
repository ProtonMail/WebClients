import type { ReactNode } from 'react';

import { serverTime } from '@protontech/crypto';
import { act, renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useGetUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { getClientID } from '@proton/shared/lib/apps/helper';
import {
    getDrawerAppFromURL,
    getIsDrawerPostMessage,
    getIsIframedDrawerApp,
    postMessageToIframe,
} from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import useAuthentication from '../useAuthentication';
import useDrawer, { DrawerProvider } from './useDrawer';
import useDrawerLocalStorage from './useDrawerLocalStorage';
import useToggleDrawerApp from './useToggleDrawerApp';

vi.mock('@proton/account/user/hooks');
vi.mock('@proton/account/earlyAccess/versionCookie', () => ({ versionCookieAtLoad: 'test-version' }));
vi.mock('./useDrawerLocalStorage');
vi.mock('./useToggleDrawerApp');
vi.mock('@proton/app-context/useApi');
vi.mock('../useAuthentication');
vi.mock('@protontech/crypto');
vi.mock('@proton/shared/lib/apps/helper');
vi.mock('@proton/shared/lib/apps/slugHelper');
vi.mock('@proton/shared/lib/authentication/persistedSessionStorage');
vi.mock('@proton/shared/lib/authentication/pathnameHelper');
vi.mock('@proton/shared/lib/drawer/helpers');
vi.mock('@proton/shared/lib/fetch/ApiError', () => ({
    ApiError: class ApiError extends Error {},
    serializeApiErrorData: vi.fn((err) => err),
}));
vi.mock('@proton/shared/lib/fetch/headers');
vi.mock('@proton/shared/lib/helpers/sentry');

const mockUseApi = useApi as Mock;
const mockUseAuthentication = useAuthentication as Mock;
const mockUseGetUser = useGetUser as Mock;
const mockUseDrawerLocalStorage = useDrawerLocalStorage as Mock;
const mockUseToggleDrawerApp = useToggleDrawerApp as Mock;
const mockGetIsDrawerPostMessage = getIsDrawerPostMessage as unknown as Mock;
const mockGetDrawerAppFromURL = getDrawerAppFromURL as Mock;
const mockGetIsIframedDrawerApp = getIsIframedDrawerApp as unknown as Mock;
const mockPostMessageToIframe = postMessageToIframe as Mock;
const mockGetAppVersionHeaders = getAppVersionHeaders as Mock;
const mockGetClientID = getClientID as Mock;
const mockServerTime = serverTime as Mock;

const MOCK_APP = 'proton-calendar';
const MOCK_IFRAME_SRC = 'https://calendar.proton.me/u/1/';

const mockApi = vi.fn();

const fireMessage = async (data: object, origin = 'https://calendar.proton.me') => {
    await act(async () => {
        window.dispatchEvent(new MessageEvent('message', { data, origin }));
    });
};

const createWrapper = (defaultShowDrawerSidebar?: boolean) => {
    const DrawerProviderWrapper = ({ children }: { children: ReactNode }) => (
        <DrawerProvider defaultShowDrawerSidebar={defaultShowDrawerSidebar}>{children}</DrawerProvider>
    );
    return DrawerProviderWrapper;
};

describe('useDrawer', () => {
    describe('DrawerProvider not initialized', () => {
        it('should throw an error', () => {
            expect(() => renderHook(() => useDrawer())).toThrow(new Error('Drawer provider not initialized'));
        });
    });

    describe('DrawerProvider initialized', () => {
        beforeEach(() => {
            vi.clearAllMocks();

            mockUseApi.mockReturnValue(mockApi);
            mockUseAuthentication.mockReturnValue({
                getLocalID: vi.fn().mockReturnValue(1),
                getUID: vi.fn().mockReturnValue('uid'),
                getPassword: vi.fn().mockReturnValue('password'),
                getPersistent: vi.fn().mockReturnValue(false),
                getTrusted: vi.fn().mockReturnValue(false),
                getClientKey: vi.fn().mockReturnValue('clientKey'),
                getOfflineKey: vi.fn().mockReturnValue(undefined),
            });
            mockUseGetUser.mockReturnValue(vi.fn().mockResolvedValue({ ID: 'user123' }));
            mockUseDrawerLocalStorage.mockReturnValue({ setDrawerLocalStorageKey: vi.fn() });
            mockUseToggleDrawerApp.mockReturnValue(vi.fn());
            mockGetIsDrawerPostMessage.mockReturnValue(true);
            mockGetDrawerAppFromURL.mockReturnValue(MOCK_APP);
            mockGetIsIframedDrawerApp.mockReturnValue(true);
            mockGetAppVersionHeaders.mockReturnValue({});
            mockGetClientID.mockReturnValue('web-calendar');
            mockServerTime.mockReturnValue(Date.now());
        });

        it('should return default context values', () => {
            const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

            expect(result.current.appInView).toBeUndefined();
            expect(result.current.iframeSrcMap).toEqual({});
            expect(result.current.iframeURLMap).toEqual({});
            expect(result.current.showDrawerSidebar).toBeUndefined();
            expect(result.current.drawerSidebarMounted).toBe(false);
        });

        describe('message handling', () => {
            it('should ignore messages coming from unauthorized origin', async () => {
                // Simulate a message from an unauthorized origin
                mockGetIsDrawerPostMessage.mockReturnValue(false);

                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                act(() => {
                    result.current.setAppInView(MOCK_APP as any);
                });

                await fireMessage({ type: DRAWER_EVENTS.CLOSE });

                // CLOSE was ignored, appInView stays as set
                expect(result.current.appInView).toBe(MOCK_APP);
            });

            it('should handle CLOSE event and clear appInView', async () => {
                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                act(() => {
                    result.current.setAppInView(MOCK_APP as any);
                });
                expect(result.current.appInView).toBe(MOCK_APP);

                await fireMessage({ type: DRAWER_EVENTS.CLOSE });

                expect(result.current.appInView).toBeUndefined();
            });

            it('should handle CLOSE event and remove the iframe src', async () => {
                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                act(() => {
                    result.current.setIframeSrcMap({ [MOCK_APP]: MOCK_IFRAME_SRC } as any);
                    result.current.setAppInView(MOCK_APP as any);
                });

                await fireMessage({
                    type: DRAWER_EVENTS.CLOSE,
                    payload: { app: MOCK_APP, closeDefinitely: true },
                });

                expect(result.current.appInView).toBeUndefined();
                expect((result.current.iframeSrcMap as Record<string, string | undefined>)[MOCK_APP]).toBeUndefined();
            });
        });

        describe('API_REQUEST handling', () => {
            beforeEach(() => {
                mockApi.mockResolvedValue({ data: 'result' });
            });

            it('should call the api and posts a success response', async () => {
                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                act(() => {
                    result.current.setIframeSrcMap({ [MOCK_APP]: MOCK_IFRAME_SRC } as any);
                });

                await fireMessage({
                    type: DRAWER_EVENTS.API_REQUEST,
                    payload: {
                        arg: { url: '/core/v4/keys' },
                        id: 'req-1',
                        appVersion: '5.0.0',
                        hasAbortController: false,
                    },
                });

                expect(mockApi).toHaveBeenCalled();
                expect(mockPostMessageToIframe).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: DRAWER_EVENTS.API_RESPONSE,
                        payload: expect.objectContaining({ id: 'req-1', success: true }),
                    }),
                    MOCK_APP
                );
            });

            it('should post an error response when the api call fails', async () => {
                mockApi.mockRejectedValue(new Error('network error'));

                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                act(() => {
                    result.current.setIframeSrcMap({ [MOCK_APP]: MOCK_IFRAME_SRC } as any);
                });

                await fireMessage({
                    type: DRAWER_EVENTS.API_REQUEST,
                    payload: { arg: {}, id: 'req-1', appVersion: '5.0.0', hasAbortController: false },
                });

                expect(mockPostMessageToIframe).toHaveBeenCalledWith(
                    expect.objectContaining({
                        type: DRAWER_EVENTS.API_RESPONSE,
                        payload: expect.objectContaining({ id: 'req-1', success: false }),
                    }),
                    MOCK_APP
                );
            });

            it('should skip events when the app is not in iframeSrcMap', async () => {
                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                // iframeSrcMap is empty by default
                await fireMessage({
                    type: DRAWER_EVENTS.API_REQUEST,
                    payload: { arg: {}, id: 'req-1', appVersion: '5.0.0', hasAbortController: false },
                });

                expect(result.current.iframeSrcMap).toEqual({});
                expect(mockApi).not.toHaveBeenCalled();
            });

            it('should attach an abort signal to the api call when hasAbortController is true', async () => {
                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                act(() => {
                    result.current.setIframeSrcMap({ [MOCK_APP]: MOCK_IFRAME_SRC } as any);
                });

                await fireMessage({
                    type: DRAWER_EVENTS.API_REQUEST,
                    payload: {
                        arg: { url: '/core/v4/keys' },
                        id: 'req-1',
                        appVersion: '5.0.0',
                        hasAbortController: true,
                    },
                });

                const calledArg = mockApi.mock.calls[0][0];
                expect(calledArg.signal).toBeInstanceOf(AbortSignal);
            });
        });

        describe('ABORT_REQUEST handling', () => {
            it('should do nothing when the event id is not stored', async () => {
                const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                // Ensure iframeSrcMap is set so the handler is aware of the app
                act(() => {
                    result.current.setIframeSrcMap({ [MOCK_APP]: MOCK_IFRAME_SRC } as any);
                });

                await fireMessage({
                    type: DRAWER_EVENTS.ABORT_REQUEST,
                    payload: { id: 'unknown-id' },
                });

                expect(abortSpy).not.toHaveBeenCalled();
                abortSpy.mockRestore();
            });

            it('should abort the controller when the event id is found', async () => {
                const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

                // Keep the API pending so the controller stays in the array when ABORT_REQUEST arrives
                mockApi.mockImplementation(() => new Promise(() => {}));

                const { result } = renderHook(() => useDrawer(), { wrapper: createWrapper() });

                act(() => {
                    result.current.setIframeSrcMap({ [MOCK_APP]: MOCK_IFRAME_SRC } as any);
                });

                // Add a controller via API_REQUEST
                await fireMessage({
                    type: DRAWER_EVENTS.API_REQUEST,
                    payload: { arg: {}, id: 'req-1', appVersion: '5.0.0', hasAbortController: true },
                });

                // Abort it
                await fireMessage({
                    type: DRAWER_EVENTS.ABORT_REQUEST,
                    payload: { id: 'req-1' },
                });

                expect(abortSpy).toHaveBeenCalledTimes(1);
                abortSpy.mockRestore();
            });
        });
    });
});
