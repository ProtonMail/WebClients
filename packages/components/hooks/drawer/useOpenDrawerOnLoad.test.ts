/* eslint-disable no-console */
import { renderHook } from '@testing-library/react-hooks';

import { useUser } from '@proton/account/user/hooks';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import useOnline from '@proton/components/hooks/useOnline';
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

import useOpenDrawerOnLoad from './useOpenDrawerOnLoad';

// Mock dependencies
jest.mock('@proton/account/user/hooks');
const mockUseUseUser = useUser as jest.Mock;
jest.mock('@proton/components/hooks/drawer/useDrawer');
const mockUseDrawer = useDrawer as jest.Mock;
jest.mock('@proton/components/hooks/useApiStatus');
const mockUseApiStatus = useApiStatus as jest.Mock;
jest.mock('@proton/components/hooks/useAuthentication');
const mockUseAuthentication = useAuthentication as jest.Mock;
jest.mock('@proton/components/hooks/useConfig');
const mockUseConfig = useConfig as jest.Mock;
jest.mock('@proton/components/hooks/useOnline');
const mockUseOnline = useOnline as jest.Mock;
jest.mock('@proton/shared/lib/helpers/storage');
const mockGetItem = getItem as jest.Mock;
jest.mock('@proton/shared/lib/drawer/helpers');
const mockGetLocalStorageUserDrawerKey = getLocalStorageUserDrawerKey as jest.Mock;
const mockGetIsDrawerApp = getIsDrawerApp as unknown as jest.Mock;
const mockGetDisplayDrawerApp = getDisplayDrawerApp as jest.Mock;
const mockGetLocalIDFromPathname = getLocalIDFromPathname as jest.Mock;
const mockGetIsIframedDrawerApp = getIsIframedDrawerApp as unknown as jest.Mock;
jest.mock('@proton/shared/lib/apps/helper');
const mockGetAppHref = getAppHref as jest.Mock;
jest.mock('@proton/shared/lib/authentication/pathnameHelper');

const mockSetIframeSrcMap = jest.fn();
const mockSetIframeURLMap = jest.fn();
const mockSetAppInView = jest.fn();
const mockLocalID = 'localId123';

const mockApp = 'CALENDAR';
const mockPath = '/calendar';
const mockUrl = 'https://calendar.proton.me/calendarID/calendar';

describe('useOpenDrawerOnLoad', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockUseUseUser.mockReturnValue([{ ID: 'user123' }]);
        mockUseConfig.mockReturnValue({ APP_NAME: 'MAIL' });
        mockUseApiStatus.mockReturnValue({ offline: false });
        mockUseOnline.mockReturnValue(true);
        mockUseAuthentication.mockReturnValue({ getLocalID: jest.fn().mockReturnValue(mockLocalID) });
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
        console.error = jest.fn();

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
