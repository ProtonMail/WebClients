import type { ReactNode } from 'react';
import React from 'react';

import { renderHook } from '@testing-library/react-hooks';

import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import * as drawerHelpers from '@proton/shared/lib/drawer/helpers';

import { DrawerContext } from './useDrawer';
import useDrawerParent from './useDrawerParent';

jest.mock('@proton/shared/lib/apps/slugHelper', () => ({
    getAppFromPathnameSafe: jest.fn(),
}));

jest.mock('@proton/shared/lib/drawer/helpers', () => ({
    ...jest.requireActual('@proton/shared/lib/drawer/helpers'),
    addParentAppToUrl: jest.fn(),
    // getIsAuthorizedApp is not mocked: the real implementation returns true for APPS.PROTONMAIL
}));

const mockGetAppFromPathnameSafe = getAppFromPathnameSafe as jest.Mock;
const mockAddParentAppToUrl = drawerHelpers.addParentAppToUrl as unknown as jest.Mock;

const CORRECTED_URL = 'https://calendar.proton.me/u/0/mail/week';

const makeWrapper = (mockSetParentApp: jest.Mock) =>
    function Wrapper({ children }: { children: ReactNode }) {
        return React.createElement(
            DrawerContext.Provider,
            {
                value: {
                    setParentApp: mockSetParentApp,
                    appInView: undefined,
                    setAppInView: jest.fn(),
                    iframeSrcMap: {},
                    setIframeSrcMap: jest.fn(),
                    iframeURLMap: {},
                    setIframeURLMap: jest.fn(),
                    showDrawerSidebar: undefined,
                    setShowDrawerSidebar: jest.fn(),
                    drawerSidebarMounted: false,
                    setDrawerSidebarMounted: jest.fn(),
                    parentApp: undefined,
                },
            },
            children
        );
    };

describe('useDrawerParent', () => {
    let mockSetParentApp: jest.Mock;
    let replaceStateSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSetParentApp = jest.fn();
        replaceStateSpy = jest.spyOn(window.history, 'replaceState').mockImplementation(() => {});
        mockAddParentAppToUrl.mockReturnValue(CORRECTED_URL);
    });

    afterEach(() => {
        replaceStateSpy.mockRestore();
    });

    describe('when preloadedParentApp is provided', () => {
        it('sets parentApp in context using the pre-captured value even when URL has no parent app segment', () => {
            mockGetAppFromPathnameSafe.mockReturnValue(undefined);

            renderHook(() => useDrawerParent(APPS.PROTONMAIL), { wrapper: makeWrapper(mockSetParentApp) });

            expect(mockSetParentApp).toHaveBeenCalledWith(APPS.PROTONMAIL);
        });

        it('corrects the URL when the parent app segment is missing', () => {
            mockGetAppFromPathnameSafe.mockReturnValue(undefined);

            renderHook(() => useDrawerParent(APPS.PROTONMAIL), { wrapper: makeWrapper(mockSetParentApp) });

            expect(mockAddParentAppToUrl).toHaveBeenCalledWith(window.location.href, APPS.PROTONMAIL, false);
            expect(replaceStateSpy).toHaveBeenCalledWith(null, '', CORRECTED_URL);
        });

        it('does not correct the URL when the parent app segment is already present', () => {
            mockGetAppFromPathnameSafe.mockReturnValue(APPS.PROTONMAIL);

            renderHook(() => useDrawerParent(APPS.PROTONMAIL), { wrapper: makeWrapper(mockSetParentApp) });

            expect(replaceStateSpy).not.toHaveBeenCalled();
        });
    });

    describe('when preloadedParentApp is not provided', () => {
        it('reads parentApp from the current pathname', () => {
            mockGetAppFromPathnameSafe.mockReturnValue(APPS.PROTONMAIL);

            renderHook(() => useDrawerParent(), { wrapper: makeWrapper(mockSetParentApp) });

            expect(mockSetParentApp).toHaveBeenCalledWith(APPS.PROTONMAIL);
        });

        it('does not set parentApp when pathname has no parent app segment', () => {
            mockGetAppFromPathnameSafe.mockReturnValue(undefined);

            renderHook(() => useDrawerParent(), { wrapper: makeWrapper(mockSetParentApp) });

            expect(mockSetParentApp).not.toHaveBeenCalled();
        });

        it('does not attempt URL correction when no preloaded value is available', () => {
            mockGetAppFromPathnameSafe.mockReturnValue(undefined);

            renderHook(() => useDrawerParent(), { wrapper: makeWrapper(mockSetParentApp) });

            expect(replaceStateSpy).not.toHaveBeenCalled();
        });
    });
});
