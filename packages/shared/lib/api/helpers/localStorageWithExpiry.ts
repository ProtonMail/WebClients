interface StoredItem {
    value: string;
    expiresAt: number;
}

/**
 * Enhances the local storage capabilities by allowing data to be stored with an expiration time.
 * When data expires, it can be automatically purged from storage.
 */
const localStorageWithExpiry = {
    /**
     * Stores a data item with an expiration time in local storage.
     *
     * @param key - The key under which the item will be stored.
     * @param value - The stringified value to be stored.
     * @param expirationInMs - The duration in milliseconds after which the item expires. Defaults to 600000ms (10 minutes).
     */
    storeData: (key: string, value: string, expirationInMs: number = 10 * 60 * 1000): void => {
        const item: StoredItem = {
            value,
            expiresAt: Date.now() + expirationInMs,
        };
        window.localStorage.setItem(key, JSON.stringify(item));
    },

    /**
     * Retrieves a data item from local storage if it has not expired.
     *
     * @param key - The key of the item to retrieve.
     * @returns The stored value if it is still valid, or null if it has expired or does not exist.
     */
    getData: (key: string): string | null => {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue) {
            const { value, expiresAt }: StoredItem = JSON.parse(storedValue);
            if (expiresAt > Date.now()) {
                return value;
            }
            window.localStorage.removeItem(key);
        }
        return null;
    },

    /**
     * Removes a data item from local storage.
     *
     * @param key - The key of the item to remove.
     */
    deleteData: (key: string): void => {
        window.localStorage.removeItem(key);
    },

    /**
     * Checks if a data item in local storage has expired and removes it if so.
     *
     * @param key - The key of the item to check for expiration.
     */
    deleteDataIfExpired: (key: string): void => {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue) {
            const { expiresAt }: StoredItem = JSON.parse(storedValue);
            if (expiresAt < Date.now()) {
                window.localStorage.removeItem(key);
            }
        }
    },
};

export default localStorageWithExpiry;
