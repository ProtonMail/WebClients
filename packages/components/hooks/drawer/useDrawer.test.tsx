import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react-hooks';

import { useGetUser } from '@proton/account/user/hooks';
import useDrawerLocalStorage from '@proton/components/hooks/drawer/useDrawerLocalStorage';
import useToggleDrawerApp from '@proton/components/hooks/drawer/useToggleDrawerApp';
import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { serverTime } from '@proton/crypto';
import { getClientID } from '@proton/shared/lib/apps/helper';
import {
    getDrawerAppFromURL,
    getIsDrawerPostMessage,
    getIsIframedDrawerApp,
    postMessageToIframe,
} from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';

import useDrawer, { DrawerProvider } from './useDrawer';

jest.mock('@proton/account/user/hooks');
jest.mock('@proton/components/helpers/versionCookie', () => ({ versionCookieAtLoad: 'test-version' }));
jest.mock('@proton/components/hooks/drawer/useDrawerLocalStorage');
jest.mock('@proton/components/hooks/drawer/useToggleDrawerApp');
jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/components/hooks/useAuthentication');
jest.mock('@proton/crypto');
jest.mock('@proton/shared/lib/apps/helper');
jest.mock('@proton/shared/lib/apps/slugHelper');
jest.mock('@proton/shared/lib/authentication/persistedSessionStorage');
jest.mock('@proton/shared/lib/authentication/pathnameHelper');
jest.mock('@proton/shared/lib/drawer/helpers');
jest.mock('@proton/shared/lib/fetch/ApiError', () => ({
    ApiError: class ApiError extends Error {},
    serializeApiErrorData: jest.fn((err) => err),
}));
jest.mock('@proton/shared/lib/fetch/headers');
jest.mock('@proton/shared/lib/helpers/sentry');

const mockUseApi = useApi as jest.Mock;
const mockUseAuthentication = useAuthentication as jest.Mock;
const mockUseGetUser = useGetUser as jest.Mock;
const mockUseDrawerLocalStorage = useDrawerLocalStorage as jest.Mock;
const mockUseToggleDrawerApp = useToggleDrawerApp as jest.Mock;
const mockGetIsDrawerPostMessage = getIsDrawerPostMessage as unknown as jest.Mock;
const mockGetDrawerAppFromURL = getDrawerAppFromURL as jest.Mock;
const mockGetIsIframedDrawerApp = getIsIframedDrawerApp as unknown as jest.Mock;
const mockPostMessageToIframe = postMessageToIframe as jest.Mock;
const mockGetAppVersionHeaders = getAppVersionHeaders as jest.Mock;
const mockGetClientID = getClientID as jest.Mock;
const mockServerTime = serverTime as jest.Mock;

const MOCK_APP = 'proton-calendar';
const MOCK_IFRAME_SRC = 'https://calendar.proton.me/u/1/';

const mockApi = jest.fn();

const fireMessage = async (data: object, origin = 'https://calendar.proton.me') => {
    await act(async () => {
        window.dispatchEvent(new MessageEvent('message', { data, origin }));
    });
};

const createWrapper = (defaultShowDrawerSidear?: boolean) => {
    const DrawerProviderWrapper = ({ children }: { children: ReactNode }) => (
        <DrawerProvider defaultShowDrawerSidear={defaultShowDrawerSidear}>{children}</DrawerProvider>
    );
    return DrawerProviderWrapper;
};

describe('useDrawer', () => {
    describe('DrawerProvider not initialized', () => {
        it('should throw an error', () => {
            const { result } = renderHook(() => useDrawer());
            expect(result.error).toEqual(new Error('Drawer provider not initialized'));
        });
    });

    describe('DrawerProvider initialized', () => {
        beforeEach(() => {
            jest.clearAllMocks();

            mockUseApi.mockReturnValue(mockApi);
            mockUseAuthentication.mockReturnValue({
                getLocalID: jest.fn().mockReturnValue(1),
                getUID: jest.fn().mockReturnValue('uid'),
                getPassword: jest.fn().mockReturnValue('password'),
                getPersistent: jest.fn().mockReturnValue(false),
                getTrusted: jest.fn().mockReturnValue(false),
                getClientKey: jest.fn().mockReturnValue('clientKey'),
                getOfflineKey: jest.fn().mockReturnValue(undefined),
            });
            mockUseGetUser.mockReturnValue(jest.fn().mockResolvedValue({ ID: 'user123' }));
            mockUseDrawerLocalStorage.mockReturnValue({ setDrawerLocalStorageKey: jest.fn() });
            mockUseToggleDrawerApp.mockReturnValue(jest.fn());
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
                const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

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
                const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

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
