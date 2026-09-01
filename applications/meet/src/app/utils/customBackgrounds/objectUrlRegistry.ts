import { sniffBackgroundMediaType } from './validateBackground';

export const createObjectUrlRegistry = () => {
    const urls = new Map<string, string>();

    const revoke = (key: string) => {
        const existing = urls.get(key);

        if (existing) {
            URL.revokeObjectURL(existing);
            urls.delete(key);
        }
    };

    return {
        set: (key: string, bytes: Uint8Array<ArrayBuffer>): string | undefined => {
            revoke(key);

            const mediaType = sniffBackgroundMediaType(bytes);

            if (!mediaType) {
                return undefined;
            }

            const url = URL.createObjectURL(new Blob([bytes], { type: mediaType }));
            urls.set(key, url);

            return url;
        },
        get: (key: string) => urls.get(key),
        revoke,
        revokeAll: () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
            urls.clear();
        },
    };
};
