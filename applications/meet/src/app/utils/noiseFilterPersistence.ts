const STORAGE_KEY = 'meetNoiseFilter';

export const getPersistedNoiseFilter = (): boolean | null => {
    try {
        const value = localStorage.getItem(STORAGE_KEY);

        if (value === null) {
            return null;
        }

        return value === 'true';
    } catch {
        return null;
    }
};

export const persistNoiseFilter = (enabled: boolean) => {
    try {
        localStorage.setItem(STORAGE_KEY, enabled.toString());
    } catch {}
};
