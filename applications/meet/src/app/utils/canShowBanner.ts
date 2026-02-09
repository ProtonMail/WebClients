export const canShowBanner = (storageKey: string) => {
    try {
        const value = localStorage.getItem(storageKey);
        if (!value) {
            return true;
        }

        const expiresAt = Number(value);

        if (!Number.isFinite(expiresAt)) {
            localStorage.removeItem(storageKey);
            return true;
        }

        if (Date.now() > expiresAt) {
            localStorage.removeItem(storageKey);
            return true;
        }

        return false;
    } catch {
        return true;
    }
};
