import { db } from 'proton-authenticator/lib/db/db';
import type { RemoteKey } from 'proton-authenticator/lib/db/entities/remote-keys';
import logger from 'proton-authenticator/lib/logger';

import type { Maybe, MaybeNull } from '@proton/pass/types/utils';
import {
    getPersistedSessions,
    removePersistedSessionByLocalIDAndUID,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import type { Api, DecryptedKey } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

export type EncryptionKey = {
    id: string;
    userKeyId: string;
    keyBytes: Uint8Array<ArrayBuffer>;
};

type AuthServiceState = {
    /** In-memory user-keys. Hydrated only after a
     * session has been successfully resumed from
     * the initial user model request. */
    userKeys: DecryptedKey[];

    /** In-memory offlineKD derived from the user's
     * app password. Only available if app-lock is
     * set to `password` and app is unlocked. */
    encryptedAppPassword?: Uint8Array<ArrayBuffer>;

    /** FIXME: proton-sync `enabled` is derived from
     * this `api` object being present accross the redux
     * thunks. We should rather derive from settings. */
    api?: Api;
};

const createAuthService = () => {
    const state: AuthServiceState = { userKeys: [] };

    /** FIXME: this shouldn't live here as this blocks
     * us from doing unauthenticated API calls */
    const setApi = (authenticatedAPI?: Api) => (state.api = authenticatedAPI);
    const getApi = () => state.api;

    const setAppPassword = (key: Maybe<Uint8Array<ArrayBuffer>>) => (state.encryptedAppPassword = key);
    const getAppPassword = () => state.encryptedAppPassword;

    /** Retrieves current user keys if any. These should never
     * be persisted and just live in memory when a session has
     * been successfully resumed. */
    const getUserKeys = () => state.userKeys;

    /** Concatenates and de-duplicates provided keys to `state.userKeys` */
    const addUserKeys = (keys: DecryptedKey[]) => {
        const newKeys = keys.filter((key) => !state.userKeys.find(({ ID }) => ID === key.ID));
        state.userKeys.push(...newKeys);
        logger.info(`[AuthService::addUserKeys] Added ${newKeys.length}/${keys.length} keys`);
    };

    const parseStoredKey = ({ id, userKeyId, encodedKey }: RemoteKey): EncryptionKey => ({
        id,
        userKeyId,
        keyBytes: base64StringToUint8Array(encodedKey),
    });

    const getEncryptionKeys = () => db.keys.toSafeArray();

    /** `id` is the remote key back-end id - not the `userKeyId` */
    const getEncryptionKeyById = async (remoteKeyId: string): Promise<Maybe<EncryptionKey>> => {
        const storedKey = await db.keys.get(remoteKeyId);
        if (storedKey) return parseStoredKey(storedKey);
    };

    /** Resolves the first available encryption key by matching user keys with
     * stored encryption keys. User keys are prioritized by order (primary first).
     * Returns the first successfully matched and parsed encryption key. */
    const getEncryptionKey = async (): Promise<Maybe<EncryptionKey>> => {
        if (state.userKeys.length === 0) throw new Error('Missing userKeys: cannot resolve encryption key');

        const encryptionKeys = await getEncryptionKeys();

        const encryptionKey = state.userKeys.reduce<MaybeNull<RemoteKey>>((key, userKey) => {
            if (key) return key;
            const match = encryptionKeys.find(({ userKeyId }) => userKeyId === userKey.ID);
            return match ?? null;
        }, null);

        return encryptionKey ? parseStoredKey(encryptionKey) : undefined;
    };

    const addEncryptionKeys = async (keys: EncryptionKey[]) => {
        const storedKeys: RemoteKey[] = keys.map(({ id, userKeyId, keyBytes }) => ({
            id,
            userKeyId,
            encodedKey: uint8ArrayToBase64String(keyBytes),
        }));

        await db.keys.bulkPut(storedKeys);
        logger.info(`[AuthService::addEncryptionKeys] Added ${keys.length} keys`);
    };

    const clearRemoteKeys = () => db.keys.clear();

    const clear = async () => {
        const sessions = getPersistedSessions();
        for (const { localID, UID } of sessions) await removePersistedSessionByLocalIDAndUID(localID, UID).catch(noop);

        delete state.api;
        delete state.encryptedAppPassword;
        state.userKeys.length = 0;
    };

    return {
        addEncryptionKeys,
        addUserKeys,
        clear,
        clearRemoteKeys,
        getApi,
        getAppPassword,
        getEncryptionKeyById,
        getEncryptionKey,
        getUserKeys,
        setApi,
        setAppPassword,
    };
};

export const authService = createAuthService();
