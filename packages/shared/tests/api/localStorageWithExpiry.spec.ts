import localStorageWithExpiry from '../../lib/api/helpers/localStorageWithExpiry';

describe('localStorageWithExpiry', () => {
    let originalDateNow: typeof Date.now;
    const mockedDateNow = 10;

    beforeEach(() => {
        originalDateNow = Date.now;
        Date.now = () => mockedDateNow;
    });

    afterEach(() => {
        Date.now = originalDateNow;
        window.localStorage.clear();
    });

    describe('storeData', () => {
        it('should store data with an expiration time', async () => {
            const key = 'test-key';
            const value = 'test-value';
            const expirationInMs = 1000;
            localStorageWithExpiry.storeData(key, value, expirationInMs);

            const results = JSON.parse(window.localStorage.getItem(key) || '');
            expect(results.value).toEqual(value);
            expect(results.expiresAt).toEqual(mockedDateNow + expirationInMs);
        });
    });

    describe('getData', () => {
        it('should return data if it exists and has not expired', async () => {
            const key = 'test-key';
            const value = 'test-value';
            const expirationInMs = 1000;
            localStorageWithExpiry.storeData(key, value, expirationInMs);
            expect(localStorageWithExpiry.getData(key)).toBe(value);
        });

        it('should return null if data does not exist', async () => {
            const key = 'test-key';
            expect(localStorageWithExpiry.getData(key)).toBe(null);
        });

        it('should return null if data has expired', async () => {
            const key = 'test-key';
            const value = 'test-value';
            const expirationInMs = -1;
            localStorageWithExpiry.storeData(key, value, expirationInMs);
            expect(localStorageWithExpiry.getData(key)).toBe(null);
        });
    });

    describe('deleteData', () => {
        it('should remove data from storage', async () => {
            const key = 'test-key';
            const value = 'test-value';
            localStorageWithExpiry.storeData(key, value);

            expect(JSON.parse(window.localStorage.getItem(key) || '').value).toEqual(value);

            localStorageWithExpiry.deleteData(key);

            expect(window.localStorage.getItem(key)).toEqual(null);
        });
    });

    describe('deleteDataIfExpired', () => {
        it('should remove data from storage only if it is expired', async () => {
            const key = 'test-key';
            const value = 'test-value';
            localStorageWithExpiry.storeData(key, value);
            expect(JSON.parse(window.localStorage.getItem(key) || '').value).toEqual(value);

            // Not Expired
            localStorageWithExpiry.deleteDataIfExpired(key);
            expect(JSON.parse(window.localStorage.getItem(key) || '').value).toEqual(value);

            // Expired
            localStorageWithExpiry.storeData(key, value, -1);
            localStorageWithExpiry.deleteDataIfExpired(key);
            expect(window.localStorage.getItem(key)).toEqual(null);
        });
    });
});
