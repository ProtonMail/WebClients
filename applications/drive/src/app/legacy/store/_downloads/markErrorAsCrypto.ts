import { EnrichedError } from '@proton/drive/legacy/errorHandling';

export const markErrorAsCrypto = async <T>(cb: () => Promise<T>): Promise<T> => {
    try {
        return await cb();
    } catch (e: unknown) {
        if (e instanceof Error) {
            const error = new EnrichedError(`Download failed: ${e.message || 'crypto'}`, {
                extra: { e, crypto: true },
            });
            throw error;
        }
        throw e;
    }
};
