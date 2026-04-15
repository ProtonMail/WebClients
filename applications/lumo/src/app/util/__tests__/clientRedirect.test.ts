// Import after mocking
import { handleLegacyUrlRedirect } from '../clientRedirect';

/**
 * Tests for client redirect functionality
 * Run with: yarn test -- clientRedirect.test.ts
 */

// Mock window.location for testing
const mockLocation = {
    hostname: '',
    pathname: '',
    search: '',
    hash: '',
    href: '',
    replace: jest.fn(),
};

// Mock console methods
const mockConsoleError = jest.fn();

Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true,
});

console.error = mockConsoleError;

describe('handleLegacyUrlRedirect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocation.replace.mockClear();
    });

    it('should redirect /about to /lumo', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/about';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/about';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/lumo');
    });

    it('should redirect /fr/about to /fr/lumo', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/fr/about';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/fr/about';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/fr/lumo');
    });

    it('should redirect /es-419/business to /es-419/business/lumo', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/es-419/business';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/es-419/business';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/es-419/business/lumo');
    });

    it('should redirect /nb/about to /nb/lumo (Norwegian)', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/nb/about';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/nb/about';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/nb/lumo');
    });

    it('should redirect /zh-tw/business to /zh-tw/business/lumo (Chinese Traditional)', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/zh-tw/business';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/zh-tw/business';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/zh-tw/business/lumo');
    });

    it('should redirect unsupported locale paths without locale prefix', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/xx/about'; // 'xx' is not in SUPPORTED_LOCALES but looks like locale
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/xx/about';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/lumo');
    });

    it('should redirect unsupported locale with query params', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/zz/business'; // 'zz' is not supported
        mockLocation.search = '?ref=test';
        mockLocation.hash = '#pricing';
        mockLocation.href = 'https://lumo.proton.me/zz/business?ref=test#pricing';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/business/lumo?ref=test#pricing');
    });

    it('should redirect hyphenated unsupported locale without locale prefix', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/xy-ab/legal/terms'; // 'xy-ab' looks like locale but not supported
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/xy-ab/legal/terms';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/lumo/terms');
    });

    it('should not redirect paths that dont look like locales', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/invalid/about'; // 'invalid' doesn't look like locale
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/invalid/about';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(false);
        expect(mockLocation.replace).not.toHaveBeenCalled();
    });

    it('should redirect /de/legal/terms to /de/lumo/terms', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/de/legal/terms';
        mockLocation.search = '?ref=test';
        mockLocation.hash = '#section';
        mockLocation.href = 'https://lumo.proton.me/de/legal/terms?ref=test#section';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/de/lumo/terms?ref=test#section');
    });

    it('should redirect /pt-br/legal/privacy to /pt-br/lumo/privacy-policy', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/pt-br/legal/privacy';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/pt-br/legal/privacy';

        handleLegacyUrlRedirect();

        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/pt-br/lumo/privacy-policy');
    });

    it('should not redirect non-marketing pages', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/fr/chat';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/fr/chat';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(false);
        expect(mockLocation.replace).not.toHaveBeenCalled();
    });

    it('should not redirect when on different domain', () => {
        mockLocation.hostname = 'example.com';
        mockLocation.pathname = '/about';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://example.com/about';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(false);
        expect(mockLocation.replace).not.toHaveBeenCalled();
    });

    it('should handle root path without locale', () => {
        mockLocation.hostname = 'lumo.proton.me';
        mockLocation.pathname = '/business';
        mockLocation.search = '';
        mockLocation.hash = '';
        mockLocation.href = 'https://lumo.proton.me/business';

        const result = handleLegacyUrlRedirect();

        expect(result).toBe(true);
        expect(mockLocation.replace).toHaveBeenCalledWith('https://proton.me/business/lumo');
    });
});
