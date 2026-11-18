/* eslint-disable no-console */

import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import {
    getDisplayDrawerApp,
    getIsDrawerApp,
    getIsIframedDrawerApp,
    getLocalStorageUserDrawerKey,
} from '@proton/shared/lib/drawer/helpers';
import { getItem } from '@proton/shared/lib/helpers/storage';

import useApiStatus from '../useApiStatus';
import useAuthentication from '../useAuthentication';
import useOnline from '../useOnline';
import useDrawer from './useDrawer';
import useOpenDrawerOnLoad from './useOpenDrawerOnLoad';

// Mock dependencies
vi.mock('@proton/account/user/hooks');
const mockUseUseUser = useUser as Mock;
vi.mock('./useDrawer');
const mockUseDrawer = useDrawer as Mock;
vi.mock('../useApiStatus');
const mockUseApiStatus = useApiStatus as Mock;
vi.mock('../useAuthentication');
const mockUseAuthentication = useAuthentication as Mock;
vi.mock('@proton/app-context/useConfig');
const mockUseConfig = useConfig as Mock;
vi.mock('../useOnline');
const mockUseOnline = useOnline as Mock;
vi.mock('@proton/shared/lib/helpers/storage');
const mockGetItem = getItem as Mock;
vi.mock('@proton/shared/lib/drawer/helpers');
const mockGetLocalStorageUserDrawerKey = getLocalStorageUserDrawerKey as Mock;
const mockGetIsDrawerApp = getIsDrawerApp as unknown as Mock;
const mockGetDisplayDrawerApp = getDisplayDrawerApp as Mock;
const mockGetLocalIDFromPathname = getLocalIDFromPathname as Mock;
const mockGetIsIframedDrawerApp = getIsIframedDrawerApp as unknown as Mock;
vi.mock('@proton/shared/lib/apps/helper');
const mockGetAppHref = getAppHref as Mock;
vi.mock('@proton/shared/lib/authentication/pathnameHelper');

const mockSetIframeSrcMap = vi.fn();
const mockSetIframeURLMap = vi.fn();
const mockSetAppInView = vi.fn();
const mockLocalID = 'localId123';

const mockApp = 'CALENDAR';
const mockPath = '/calendar';
const mockUrl = 'https://calendar.proton.me/calendarID/calendar';

describe('useOpenDrawerOnLoad', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseUseUser.mockReturnValue([{ ID: 'user123' }]);
        mockUseConfig.mockReturnValue({ APP_NAME: 'MAIL' });
        mockUseApiStatus.mockReturnValue({ offline: false });
        mockUseOnline.mockReturnValue(true);
        mockUseAuthentication.mockReturnValue({ getLocalID: vi.fn().mockReturnValue(mockLocalID) });
        mockUseDrawer.mockReturnValue({
            setIframeSrcMap: mockSetIframeSrcMap,
            setIframeURLMap: mockSetIframeURLMap,
            setAppInView: mockSetAppInView,
        });

        mockGetLocalStorageUserDrawerKey.mockReturnValue('user-drawer-key');
        mockGetIsDrawerApp.mockReturnValue(true);
        mockGetDisplayDrawerApp.mockReturnValue(true);
        mockGetLocalIDFromPathname.mockImplementation(() => mockLocalID);
    });

    test('should not set iframe src when localStorage is empty', () => {
        mockGetItem.mockReturnValue(null);

        renderHook(() => useOpenDrawerOnLoad());

        expect(mockSetIframeSrcMap).not.toHaveBeenCalled();
        expect(mockSetIframeURLMap).not.toHaveBeenCalled();
        expect(mockSetAppInView).not.toHaveBeenCalled();
    });

    test('should not set iframe src when app is not reachable', () => {
        mockGetItem.mockReturnValue(JSON.stringify({ app: 'CALENDAR', path: '/calendar' }));
        mockUseApiStatus.mockReturnValue({ offline: true });

        renderHook(() => useOpenDrawerOnLoad());

        expect(mockSetIframeSrcMap).not.toHaveBeenCalled();
        expect(mockSetIframeURLMap).not.toHaveBeenCalled();
        expect(mockSetAppInView).not.toHaveBeenCalled();
    });

    test('should not set iframe src when app is not a drawer app', () => {
        mockGetItem.mockReturnValue(JSON.stringify({ app: 'WALLET', path: '/wallet' }));
        mockGetIsDrawerApp.mockReturnValue(false);

        renderHook(() => useOpenDrawerOnLoad());

        expect(mockSetIframeSrcMap).not.toHaveBeenCalled();
        expect(mockSetIframeURLMap).not.toHaveBeenCalled();
        expect(mockSetAppInView).not.toHaveBeenCalled();
    });

    test('should not set iframe src when app cannot be displayed in drawer', () => {
        mockGetItem.mockReturnValue(JSON.stringify({ app: 'WALLET', path: '/wallet' }));
        mockGetDisplayDrawerApp.mockReturnValue(false);

        renderHook(() => useOpenDrawerOnLoad());

        expect(mockSetIframeSrcMap).not.toHaveBeenCalled();
        expect(mockSetIframeURLMap).not.toHaveBeenCalled();
        expect(mockSetAppInView).not.toHaveBeenCalled();
    });

    test('should not set iframe src when app is not an iframed drawer app', () => {
        mockGetItem.mockReturnValue(JSON.stringify({ app: 'CALENDAR', path: '/calendar' }));
        mockGetIsIframedDrawerApp.mockReturnValue(false);

        renderHook(() => useOpenDrawerOnLoad());

        expect(mockSetIframeSrcMap).not.toHaveBeenCalled();
        expect(mockSetIframeURLMap).not.toHaveBeenCalled();
        expect(mockSetAppInView).toHaveBeenCalledWith('CALENDAR');
    });

    test('should set iframe src map with correct URL when path and URL are available', () => {
        mockGetItem.mockReturnValue(JSON.stringify({ app: mockApp, path: mockPath }));
        mockGetIsIframedDrawerApp.mockReturnValue(true);
        mockGetAppHref.mockReturnValue(mockUrl);

        // @ts-ignore
        APPS_CONFIGURATION[mockApp] = {};

        renderHook(() => useOpenDrawerOnLoad());

        expect(mockSetIframeSrcMap).toHaveBeenCalledWith(expect.any(Function));

        // Test the map updater function
        const mapUpdater = mockSetIframeSrcMap.mock.calls[0][0];
        const result = mapUpdater({});
        expect(result).toEqual({ [mockApp]: mockUrl });

        expect(mockSetIframeURLMap).toHaveBeenCalledWith(expect.any(Function));
        // Test the URL map updater function
        const urlMapUpdater = mockSetIframeURLMap.mock.calls[0][0];
        const urlResult = urlMapUpdater({});
        expect(urlResult).toEqual({ [mockApp]: mockUrl });

        expect(mockSetAppInView).toHaveBeenCalledWith(mockApp);
    });

    test('should handle JSON parse errors', () => {
        // Mock console.error to prevent test output pollution
        console.error = vi.fn();

        // Set invalid JSON in localStorage
        mockGetItem.mockReturnValue('invalid-json');

        renderHook(() => useOpenDrawerOnLoad());

        expect(console.error).toHaveBeenCalled();
        expect(mockSetIframeSrcMap).not.toHaveBeenCalled();
        expect(mockSetIframeURLMap).not.toHaveBeenCalled();
        expect(mockSetAppInView).not.toHaveBeenCalled();
    });
});
/* eslint-enable no-console */
