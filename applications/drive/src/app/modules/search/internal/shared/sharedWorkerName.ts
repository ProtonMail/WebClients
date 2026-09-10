import { type UserId, brandSearchUserId } from './types';

const PREFIX = 'drive-search-worker';

export type SharedWorkerIdentity = {
    appVersion: string;
    userId: UserId;
};

/** Builds the `name` passed to `new SharedWorker(...)` - encodes appVersion and userId so
 *  the worker itself can recover both without any Comlink round-trip. */
export const createSharedWorkerName = ({ appVersion, userId }: SharedWorkerIdentity): string =>
    `${PREFIX}/${appVersion}/${userId}`;

/** Inverse of `createSharedWorkerName`. Throws if `name` wasn't built by it. */
export const parseSharedWorkerName = (name: string): SharedWorkerIdentity => {
    const [prefix, appVersion, userId, ...rest] = name.split('/');
    if (prefix !== PREFIX || !appVersion || !userId || rest.length > 0) {
        throw new Error(`parseSharedWorkerName: malformed shared worker name <${name}>`);
    }
    return { appVersion, userId: brandSearchUserId(userId) };
};
