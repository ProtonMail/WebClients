import localStorageWithExpiry from '@proton/shared/lib/api/helpers/localStorageWithExpiry';

import {
    PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY,
    deleteStoredUrlPassword,
    getUrlPassword,
    saveUrlPasswordForRedirection,
} from './password';

describe('URL Password Functions', () => {
    afterEach(() => {
        deleteStoredUrlPassword();
        jest.clearAllMocks();
    });

    describe('deleteStoredUrlPassword', () => {
        it('should remove password from localStorage', () => {
            localStorageWithExpiry.storeData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY, 'testPassword');
            expect(getUrlPassword()).toBe('testPassword');
            deleteStoredUrlPassword();
            window.location.hash = '';
            expect(getUrlPassword()).toBe('');
        });
    });

    describe('saveUrlPasswordForRedirection', () => {
        it('should save password for redirection', () => {
            const password = 'testPassword123';
            saveUrlPasswordForRedirection(password);
            expect(getUrlPassword()).toBe('testPassword123');
        });
    });

    describe('getUrlPassword', () => {
        it('should return password from URL hash if present', () => {
            window.location.hash = '#testPassword';
            expect(getUrlPassword()).toBe('testPassword');
        });

        it('should return password from localStorage if URL hash is empty', () => {
            window.location.hash = '';
            localStorageWithExpiry.storeData(PUBLIC_SHARE_REDIRECT_PASSWORD_STORAGE_KEY, 'storedPassword');
            expect(getUrlPassword()).toBe('storedPassword');
            expect(window.location.hash).toBe('#storedPassword');
        });

        it('should return empty string if both URL hash and localStorage are empty', () => {
            window.location.hash = '';
            expect(getUrlPassword()).toBe('');
            expect(window.location.hash).toBe('');
        });
    });
});
