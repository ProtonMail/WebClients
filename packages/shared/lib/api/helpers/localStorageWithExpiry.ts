// localStorageWithExpiry.ts
interface StoredItem {
    value: string;
    expiresAt: number;
}

const localStorageWithExpiry = {
    storeData: (key: string, value: string, expirationInMs: number = 10 * 60 * 1000): void => {
        const item: StoredItem = {
            value,
            expiresAt: Date.now() + expirationInMs,
        };
        window.localStorage.setItem(key, JSON.stringify(item));
    },

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

    deleteData: (key: string): void => {
        window.localStorage.removeItem(key);
    },

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
