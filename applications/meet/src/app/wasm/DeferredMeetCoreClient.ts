import noop from '@proton/utils/noop';

import { DirectMeetCoreClient } from './DirectMeetCoreClient';
import type { MeetCoreClient } from './MeetCoreClient';

type ForwardedMethod = Exclude<keyof MeetCoreClient, 'whenReady' | 'dispose'>;

const notForwarded = new Set(['constructor', 'whenReady', 'dispose']);

/** Every `MeetCoreClient` method must stay a prototype method of `DirectMeetCoreClient`, not an arrow function field. */
const forwardedMethods = Object.getOwnPropertyNames(DirectMeetCoreClient.prototype).filter(
    (name): name is ForwardedMethod => !notForwarded.has(name)
);

/**
 * Starts meet-core once and forwards every call once it is ready. When the start fails, every call
 * rejects with its error.
 */
export const deferMeetCoreClient = (start: () => Promise<MeetCoreClient>): MeetCoreClient => {
    const client = start();
    client.catch(noop);

    const forward =
        (method: ForwardedMethod) =>
        async (...args: unknown[]) => {
            const ready = await client;
            return (ready[method] as (...args: unknown[]) => Promise<unknown>).apply(ready, args);
        };

    const forwarders = Object.fromEntries(forwardedMethods.map((method) => [method, forward(method)])) as Pick<
        MeetCoreClient,
        ForwardedMethod
    >;

    return {
        ...forwarders,
        whenReady: async () => {
            await client;
        },
        dispose: () => {
            void client.then((ready) => ready.dispose(), noop);
        },
    };
};
