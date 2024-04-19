import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

import isSearchFeatureEnabled from './isSearchFeatureEnabled';

jest.mock('@proton/shared/lib/helpers/browser');

const mockIsMobile = jest.mocked(isMobile);
const mockIsSafari = jest.mocked(isSafari);

describe('isSearchFeatureEnabled', () => {
    test('should return false on Mobile regardless of browser', () => {
        mockIsMobile.mockReturnValue(true);
        mockIsSafari.mockReturnValue(true);
        expect(isSearchFeatureEnabled()).toEqual(false);
        mockIsMobile.mockReturnValue(true);
        mockIsSafari.mockReturnValue(false);
        expect(isSearchFeatureEnabled()).toEqual(false);
    });
    test('should return true on Desktop (not Safari browser)', () => {
        mockIsMobile.mockReturnValue(false);
        mockIsSafari.mockReturnValue(false);
        expect(isSearchFeatureEnabled()).toEqual(true);
    });
    test('should return false on Safari browser', () => {
        mockIsMobile.mockReturnValue(true);
        mockIsSafari.mockReturnValue(true);
        expect(isSearchFeatureEnabled()).toEqual(false);
        mockIsMobile.mockReturnValue(false);
        mockIsSafari.mockReturnValue(true);
        expect(isSearchFeatureEnabled()).toEqual(false);
    });
});
