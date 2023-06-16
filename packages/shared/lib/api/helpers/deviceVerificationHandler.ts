import { create as createMutex } from '@protontech/mutex-browser';

import { createOnceHandler } from '@proton/shared/lib/apiHandlers';
import { wait } from '@proton/shared/lib/helpers/promise';
import pbkdfWorkerWrapper from '@proton/shared/lib/pow/pbkdfWorkerWrapper';
import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import localStorageWithExpiry from './localStorageWithExpiry';

const onSolve = (b64Source: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const pbkdfWorker = pbkdfWorkerWrapper();
            pbkdfWorker.postMessage({ b64Source });

            pbkdfWorker.onmessage = (event) => {
                resolve(event.data);
            };

            pbkdfWorker.onerror = (error) => {
                reject(error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const createDeviceHandlers = () => {
    const deviceVerificationHandlers: { [key: string]: ReturnType<typeof createOnceHandler<string, string>> } = {};

    const deviceVerificationHandler = (
        UID: string,
        challengeType: number,
        challengePayload: string
    ): Promise<string> => {
        if (!deviceVerificationHandlers[UID]) {
            const mutex = createMutex({ expiry: 15000 });

            const getMutexLock = async (UID: string) => {
                try {
                    await mutex.lock(UID);
                    return () => {
                        return mutex.unlock(UID).catch(noop);
                    };
                } catch (e) {
                    // If getting the mutex fails, fall back to a random wait
                    await wait(randomIntFromInterval(100, 2000));
                    return () => {
                        return Promise.resolve();
                    };
                }
            };

            deviceVerificationHandlers[UID] = createOnceHandler(async (challengePayload: string): Promise<string> => {
                const unlockMutex = await getMutexLock(UID);
                let token = '';
                try {
                    const lastCachedDate = localStorageWithExpiry.getData(challengePayload);
                    if (!lastCachedDate) {
                        token = await onSolve(challengePayload);
                        localStorageWithExpiry.storeData(challengePayload, token, 1 * 60 * 1000);
                        await wait(50);
                    } else {
                        token = lastCachedDate;
                    }
                } catch (e) {
                    throw e;
                } finally {
                    await unlockMutex();
                }
                return token;
            });
        }

        return deviceVerificationHandlers[UID](challengePayload);
    };

    return deviceVerificationHandler;
};
