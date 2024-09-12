import { c } from 'ttag';

import type { CreateNotificationOptions } from '@proton/components';
import { DEFAULT_LOCK_TTL } from '@proton/pass/constants';
import { PassErrorCode } from '@proton/pass/lib/api/errors';
import { type RefreshSessionData } from '@proton/pass/lib/api/refresh';
import { getOfflineComponents, getOfflineVerifier } from '@proton/pass/lib/cache/crypto';
import type { Maybe, MaybeNull, MaybePromise } from '@proton/pass/types';
import { type Api } from '@proton/pass/types';
import { NotificationKey } from '@proton/pass/types/worker/notification';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { withCallCount } from '@proton/pass/utils/fp/with-call-count';
import { logger } from '@proton/pass/utils/logger';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { revoke, setLocalKey } from '@proton/shared/lib/api/auth';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { generateClientKey } from '@proton/shared/lib/authentication/clientKey';
import type { LocalKeyResponse } from '@proton/shared/lib/authentication/interface';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import noop from '@proton/utils/noop';

import {
    type ConsumeForkPayload,
    type RequestForkOptions,
    type RequestForkResult,
    consumeFork,
    requestFork,
} from './fork';
import { checkSessionLock } from './lock/session/lock.requests';
import type { Lock, LockAdapter, LockCreateDTO } from './lock/types';
import { LockMode } from './lock/types';
import {
    PasswordVerification,
    getPasswordVerification,
    registerExtraPassword,
    removeExtraPassword,
    verifyExtraPassword,
    verifyOfflinePassword,
    verifyPassword,
} from './password';
import {
    type AuthSession,
    type EncryptedAuthSession,
    type ResumeSessionResult,
    encryptPersistedSessionWithKey,
    getPersistedSessionKey,
    migrateSession,
    resumeSession,
    syncAuthSession,
} from './session';
import { type AuthStore } from './store';

export type AuthOptions = {
    /** `forceLock` will locally lock the session upon resuming */
    forceLock?: boolean;
    /** If `true`, will re-persist session on login */
    forcePersist?: boolean;
    /** If `true`, session resuming should be retried */
    retryable?: boolean;
    /** If `true`, the session is considered unlocked */
    unlocked?: boolean;
};

export interface AuthServiceConfig {
    api: Api;
    /** Store holding the active session data */
    authStore: AuthStore;
    /** The in-memory session is used to store the session data securely.
     * It allows resuming a session without any API calls to re-authenticate.
     * In most cases you can omit the implementation and rely on the `authStore` */
    getMemorySession?: () => MaybePromise<any>;
    /** The persisted session will be parsed and decrypted to extract the
     * session data. Requires an API call to retrieve the local key. */
    getPersistedSession: (localID: Maybe<number>) => MaybePromise<MaybeNull<EncryptedAuthSession>>;
    /**  Implement any service initialization logic in this hook. Should return
     * a boolean flag indicating wether user was authorized or not. */
    onInit: (options: AuthOptions) => Promise<boolean>;
    /** Called when authorization sequence starts: this can happen when consuming a
     * session fork or when trying to resume a session. */
    onLoginStart?: () => void;
    /** Called whenever a user is successfully authenticated. This can happen
     * after consuming a fork or resuming a session.  */
    onLoginComplete?: (userID: string, localID: Maybe<number>) => void;
    /** Called when logout sequence starts before the authentication store is cleared */
    onLogoutStart?: () => void;
    /** Called whenever a user is unauthenticated. This will be triggered any time
     * the `logout` function is called (either via user action or when an inactive
     * session is detected). The `broadcast` flag indicates wether we should
     * broadcast the unauthorized session to other clients. */
    onLogoutComplete?: (userID: Maybe<string>, localID: Maybe<number>, broadcast: boolean) => void;
    /** Called immediately after a fork has been successfully consumed. At this
     * point the user is not fully logged in yet. */
    onForkConsumed?: (session: AuthSession, payload: ConsumeForkPayload) => MaybePromise<void>;
    /** Called when a fork could not be successfully consumed. This can happen
     * if the fork data is invalid */
    onForkInvalid?: () => void;
    /** Handle the result of a fork request call. Can be used to redirect the
     * user automatically when requesting a fork from account. */
    onForkRequest?: (result: RequestForkResult) => void;
    /** Called when an invalid persistent session error is thrown during a
     * session resuming sequence. It will get called with the invalid session
     * and the localID being resumed for retry mechanisms */
    onSessionInvalid?: (
        error: unknown,
        data: {
            localID: Maybe<number>;
            invalidSession: EncryptedAuthSession;
            retry: (session: EncryptedAuthSession) => Promise<ResumeSessionResult>;
        }
    ) => MaybePromise<ResumeSessionResult>;
    /* Called when no persisted session or in-memory session can be used to
     * resume a session. */
    onSessionEmpty?: () => void;
    /** Called when a session is locked either through user action or when a
     * locked session is detected. The `broadcast` flag indicates wether we should
     * broadcast the locked session to other clients. */
    onLocked?: (mode: LockMode, localID: Maybe<number>, broadcast: boolean, userInitiated: boolean) => void;
    /** Callback when session lock is created, updated or deleted */
    onLockUpdate?: (lock: Lock, localID: Maybe<number>, broadcast: boolean) => MaybePromise<void>;
    /** Called with the `sessionLockToken` when session is successfully unlocked */
    onUnlocked?: (mode: LockMode, token: Maybe<string>, localID: Maybe<number>) => Promise<void>;
    /** Implement encrypted local session persistence using this hook. Called on every
     * successful consumed fork or unlocked session. */
    onSessionPersist?: (encryptedSession: string) => MaybePromise<void>;
    /** Called when resuming the session failed for any reason excluding inactive
     * session error. */
    onSessionFailure?: (options: AuthOptions) => MaybePromise<void>;
    /** Called when session tokens have been refreshed. The`broadcast` flag indicates
     * wether we should broadcast the refresh session data to other clients. */
    onSessionRefresh?: (localId: Maybe<number>, data: RefreshSessionData, broadcast: boolean) => MaybePromise<void>;
    /** Implement how you want to handle notifications emitted from the service */
    onNotification?: (notification: CreateNotificationOptions) => void;
    /** Triggered when extra password is required */
    onMissingScope?: () => void;
}

export const createAuthService = (config: AuthServiceConfig) => {
    const { api, authStore } = config;

    const adapters = new Map<LockMode, LockAdapter>();

    const getLockAdapter = (mode: LockMode): LockAdapter => {
        const adapter = adapters.get(mode);
        if (!adapter) throw new Error(`Lock adapter not found for "${mode}"`);
        return adapter;
    };

    const authService = {
        init: asyncLock(async (options: AuthOptions) => {
            logger.info(`[AuthService] Initialization start`);
            return config.onInit(options).catch((err) => {
                logger.warn(`[AuthService] Initialization failure`, err);
                config.onNotification?.({ type: 'error', text: getErrorMessage(err) });
                return false;
            });
        }),

        /** Stores the initial configuration object passed to the
         * auth service factory function. Useful if you want to trigger
         * certain handlers outside of the auth service flow. */
        config,

        registerLockAdapter: (mode: LockMode, adapter: LockAdapter) => adapters.set(mode, adapter),

        login: async (session: AuthSession, options: AuthOptions) => {
            config.onLoginStart?.();

            try {
                if (!authStore.validSession(session)) {
                    authStore.clear();
                    throw new Error('Invalid session');
                }

                authStore.setSession(session);
                await api.reset();

                const migrated = await migrateSession(authStore);
                if (migrated || options.forcePersist) await authService.persistSession().catch(noop);

                const lockMode = authStore.getLockMode();

                if (options?.forceLock && lockMode !== LockMode.NONE) {
                    await authService.lock(lockMode, { soft: true, broadcast: false });
                    return false;
                }

                if (!options?.unlocked) {
                    const sessionLock = await checkSessionLock();
                    const sessionLockRegistered = sessionLock.mode === LockMode.SESSION;
                    const sessionLocked = sessionLock.locked;

                    const hasToken = authStore.getLockToken() !== undefined;
                    const needsToken = sessionLockRegistered && !hasToken;
                    const overrideLock = sessionLockRegistered ? lockMode !== sessionLock.mode : false;
                    const shouldLockSession = overrideLock || sessionLocked || needsToken;

                    if (shouldLockSession) {
                        logger.info(`[AuthService] Locked session [locked=${sessionLocked},token=${hasToken}]`);
                        await authService.lock(LockMode.SESSION, { soft: true, broadcast: false });
                        return false;
                    }
                }
            } catch (err) {
                const { code } = getApiError(err);
                if (code === PassErrorCode.MISSING_SCOPE) return false;

                logger.warn(`[AuthService] Logging in session failed`, err);
                config.onNotification?.({ text: c('Warning').t`Your session could not be resumed.`, type: 'error' });
                await config?.onSessionFailure?.({ forceLock: true, retryable: true });
                return false;
            }

            logger.info(`[AuthService] User is authorized`);
            config.onLoginComplete?.(authStore.getUserID()!, authStore.getLocalID());

            return true;
        },

        logout: async (options: { soft: boolean; broadcast?: boolean }) => {
            config.onLogoutStart?.();

            const localID = authStore.getLocalID();
            const userID = authStore.getUserID();

            if (!options?.soft) await api({ ...revoke(), silence: true }).catch(noop);
            logger.info(`[AuthService] User is not authorized`);

            await api.reset();
            authStore.clear();
            authService.resumeSession.resetCount();

            config.onLogoutComplete?.(userID, localID, options.broadcast ?? true);

            return true;
        },

        consumeFork: async (payload: ConsumeForkPayload, apiUrl?: string): Promise<boolean> => {
            try {
                config.onLoginStart?.();
                const { session, Scopes } = await consumeFork({ api, payload, apiUrl });
                const validScope = Scopes.includes('pass');

                if (!validScope) {
                    /** If the scope is invalid then the user must unlock with his
                     * pass extra password in order to continue the login sequence.
                     * Clear any offline components provided by account as they will
                     * need to be recomputed against the extra password */
                    delete session.offlineConfig;
                    delete session.offlineKD;
                }

                await config.onForkConsumed?.(session, payload);

                const loggedIn = validScope && (await authService.login(session, {}));

                if (!validScope) {
                    authStore.setSession(session);
                    authStore.setExtraPassword(true);
                    config.onMissingScope?.();
                }

                const locked = authStore.getLocked();

                /** Persist the session only on successful login. If the forked session is
                 * locked, persist eitherway to avoid requiring a new fork consumption if
                 * user does not unlock immediately (reset api state for persisting). */
                if (locked) await api.reset();
                if (loggedIn || locked) await authService.persistSession({ regenerateClientKey: true });

                return loggedIn;
            } catch (error: unknown) {
                const reason = error instanceof Error ? ` (${getApiErrorMessage(error) ?? error?.message})` : '';

                config.onNotification?.({
                    text: c('Warning').t`Your session could not be authorized.` + reason,
                    type: 'error',
                });

                config.onForkInvalid?.();
                await authService.logout({ soft: true, broadcast: false });

                return false;
            }
        },

        requestFork: (options: RequestForkOptions): RequestForkResult => {
            const result = requestFork(options);
            config.onForkRequest?.(result);

            return result;
        },

        createLock: async (payload: LockCreateDTO) => {
            if (payload.mode === LockMode.NONE) return;

            const adapter = getLockAdapter(payload.mode);
            const localID = authStore.getLocalID();
            const sessionLockRegistered = authStore.getLockMode() === LockMode.SESSION;

            /** If we're creating a new lock over an
             * active API session lock - delete it first */
            const onBeforeCreate = sessionLockRegistered
                ? async () => {
                      if (!payload.current) throw new Error('Invalid lock creation');
                      const lock = await getLockAdapter(LockMode.SESSION).delete(payload.current.secret);
                      void config.onLockUpdate?.(lock, localID, false);
                  }
                : undefined;

            const lock = await adapter.create(payload, onBeforeCreate);
            void config.onLockUpdate?.(lock, localID, true);
        },

        deleteLock: async (mode: LockMode, secret: string) => {
            if (mode === LockMode.NONE) return;

            const adapter = getLockAdapter(mode);
            const lock = await adapter.delete(secret);
            const localID = authStore.getLocalID();

            void config.onLockUpdate?.(lock, localID, true);
        },

        lock: async (
            mode: LockMode,
            options: { broadcast?: boolean; soft: boolean; userInitiated?: boolean }
        ): Promise<Lock> => {
            const adapter = getLockAdapter(mode);
            const localID = authStore.getLocalID();
            const broadcast = options.broadcast ?? false;

            config.onLocked?.(mode, localID, broadcast, options.userInitiated ?? false);
            const lock = await adapter.lock(options);

            return lock;
        },

        unlock: async (mode: LockMode, secret: string): Promise<void> => {
            if (mode === LockMode.NONE) return;

            try {
                const adapter = getLockAdapter(mode);
                const token = await adapter.unlock(secret);
                const localID = authStore.getLocalID();
                await adapter.check();

                await config.onUnlocked?.(mode, token, localID);
            } catch (error) {
                /** error is thrown for clients to consume */
                logger.warn(`[AuthService] Unlock failure [mode=${mode}]`, error);
                throw error;
            }
        },

        checkLock: async (): Promise<Lock> => {
            const mode = authStore.getLockMode();
            if (mode === LockMode.NONE) return { mode: LockMode.NONE, locked: false };

            /** If we have a TTL and lastExtendTime - check early
             * if the TTL has been reached and lock accordingly */
            const ttl = authStore.getLockTTL();
            const lastExtendTime = authStore.getLockLastExtendTime();

            if (ttl && lastExtendTime) {
                const now = getEpoch();
                const diff = now - (lastExtendTime ?? 0);
                if (diff > ttl) return authService.lock(mode, { soft: true, broadcast: true });
            }

            const adapter = getLockAdapter(mode);
            const lock = await adapter.check();
            const localID = authStore.getLocalID();

            await config.onLockUpdate?.(lock, localID, false);
            return lock;
        },

        /** Passing the `regenerateClientKey` option will generate
         * a new local key and update it back-end side. Ideally, this
         * should only happen after consuming a fork. */
        persistSession: async (options?: { regenerateClientKey: boolean }) => {
            try {
                const session = authStore.getSession();
                if (!authStore.validSession(session)) throw new Error('Trying to persist invalid session');

                const clientKey = await (async () => {
                    if (options?.regenerateClientKey) {
                        const { serializedData, key } = await generateClientKey();
                        await api<LocalKeyResponse>(setLocalKey(serializedData));
                        authStore.setClientKey(serializedData);
                        return key;
                    }

                    return getPersistedSessionKey(api, authStore);
                })();

                logger.info('[AuthService] Persisting session');

                /* If the clientKey resolution sequence triggered a refresh,
                 * make sure we persist the session with the new tokens */
                const syncedSession = syncAuthSession(session, authStore);
                const encryptedSession = await encryptPersistedSessionWithKey(syncedSession, clientKey);

                await config.onSessionPersist?.(encryptedSession);
            } catch (error) {
                logger.warn(`[AuthService] Persisting session failure`, error);
            }
        },

        resumeSession: withCallCount(
            pipe(
                async (localID: Maybe<number>, options: AuthOptions): Promise<boolean> => {
                    try {
                        const memorySession = await config.getMemorySession?.();
                        const persistedSession = await config.getPersistedSession(localID);

                        /** If we have an in-memory decrypted AuthSession - use it to
                         * login without making any other API requests. Authorizing
                         * from in-memory session does not account for force lock, rather
                         * when locking the in-memory session should be cleared */
                        if (memorySession && authStore.validSession(memorySession)) {
                            logger.info(`[AuthService] Resuming in-memory session [lock=${options.forceLock}]`);
                            return await authService.login(memorySession, {});
                        }

                        /** If we have no persisted session to resume from, exit early */
                        if (!persistedSession) {
                            logger.info(`[AuthService] No persisted session found`);
                            config.onSessionEmpty?.();
                            return false;
                        }

                        logger.info(`[AuthService] Resuming persisted session [lock=${options.forceLock ?? false}]`);
                        config.onLoginStart?.();

                        /** Partially configure the auth store before resume sequence. `keyPassword`
                         * and `sessionLockToken` may be still encrypted at this point */
                        authStore.setSession(persistedSession);
                        await api.reset();

                        const result = await resumeSession(persistedSession, localID, config, options);

                        logger.info(`[AuthService] Session successfully resumed`);
                        options.forcePersist = options.forcePersist || result.repersist;
                        return await authService.login(result.session, options);
                    } catch (error: unknown) {
                        if (error instanceof Error) {
                            const message = getApiErrorMessage(error) ?? error?.message;
                            const reason = message ? ` (${message})` : '';
                            const text = c('Warning').t`Your session could not be resumed.` + reason;
                            logger.warn(`[AuthService] Resuming session failed ${reason}`);
                            config.onNotification?.({ text, type: 'error' });
                        }

                        /** If a session fails to resume due to reasons other than being locked,
                         * inactive, or offline, the sessionFailure callback should trigger the
                         * resuming process. Session errors will be managed by the API listener. */
                        const { sessionLocked, sessionInactive } = api.getState();
                        const sessionFailure = !(sessionLocked || sessionInactive);
                        if (sessionFailure) await config.onSessionFailure?.(options);

                        return false;
                    }
                },
                tap((resumed) => {
                    /** Reset the internal resume session count when session
                     * resuming succeeds */
                    if (resumed) authService.resumeSession.resetCount();
                })
            )
        ),

        /** Password confirmation can either be verified offline or online.
         * In `srp` mode, we will verify the user's password through SRP
         * (two-password mode not supported yet). If the user has an offline
         * config, we compare the `offlineKD` with the derived argon2 hash */
        confirmPassword: async (password: string, mode?: PasswordVerification): Promise<boolean> => {
            try {
                await loadCryptoWorker();

                switch (mode ?? getPasswordVerification(authStore)) {
                    case PasswordVerification.LOCAL: {
                        const offlineConfig = authStore.getOfflineConfig()!;
                        const offlineVerifier = authStore.getOfflineVerifier()!;
                        return await verifyOfflinePassword(password, { offlineConfig, offlineVerifier });
                    }

                    case PasswordVerification.EXTRA_PASSWORD: {
                        await verifyExtraPassword({ password });

                        const { offlineConfig, offlineKD } = await getOfflineComponents(password);

                        authStore.setOfflineConfig(offlineConfig);
                        authStore.setOfflineKD(offlineKD);
                        authStore.setOfflineVerifier(await getOfflineVerifier(stringToUint8Array(offlineKD)));

                        /** Online extra password verification will happen on
                         * first login after a successful fork. At this point
                         * we can enable the password lock automatically. */
                        if (
                            !EXTENSION_BUILD &&
                            [LockMode.NONE, LockMode.BIOMETRICS].includes(authStore.getLockMode())
                        ) {
                            authStore.setLockMode(LockMode.PASSWORD);
                            authStore.setLockTTL(DEFAULT_LOCK_TTL);
                        }

                        await authService.persistSession({ regenerateClientKey: true });

                        return true;
                    }

                    case PasswordVerification.SRP: {
                        return await verifyPassword({ password });
                    }
                }
            } catch (error) {
                logger.warn(`[AuthService] failed password confirmation (${getErrorMessage(error)})`);
                return false;
            }
        },

        registerExtraPassword: async (password: string): Promise<boolean> => {
            /** Compute the offline components in order to update the auth store on successful
             * extra password registration : this will affect any password locks or offline mode
             * setting. Users will now have to unlock the client with the extra password */
            const { offlineConfig, offlineKD } = await getOfflineComponents(password);
            await registerExtraPassword({ password });

            // Clear biometrics
            if (authStore.getLockMode() === LockMode.BIOMETRICS) {
                authStore.setEncryptedOfflineKD(undefined);
                authStore.setLockMode(LockMode.PASSWORD);
                await authService.config.onLockUpdate?.(
                    { mode: LockMode.PASSWORD, locked: false, ttl: authStore.getLockTTL() },
                    authStore.getLocalID(),
                    true
                );
            }

            authStore.setExtraPassword(true);
            authStore.setOfflineConfig(offlineConfig);
            authStore.setOfflineKD(offlineKD);
            authStore.setOfflineVerifier(await getOfflineVerifier(stringToUint8Array(offlineKD)));

            await authService.persistSession();
            return true;
        },

        removeExtraPassword: async (password: string) => {
            // Clear biometrics
            if (authStore.getLockMode() === LockMode.BIOMETRICS) {
                authStore.setEncryptedOfflineKD(undefined);
                await authService.config.onLockUpdate?.(
                    { mode: LockMode.PASSWORD, locked: false },
                    authStore.getLocalID(),
                    true
                );
            }

            await verifyExtraPassword({ password });
            await removeExtraPassword();
            await authService.logout({ soft: true, broadcast: true });
        },
    };

    api.subscribe(async (event) => {
        /** Ensure we have an active session before processing API events*/
        if (authStore.hasSession()) {
            switch (event.type) {
                case 'session': {
                    if (event.status === 'inactive') {
                        if (!event.silent) {
                            config.onNotification?.({
                                text: c('Warning').t`Your session is inactive.`,
                                type: 'error',
                            });
                        }
                        await authService.logout({ soft: true, broadcast: true });
                    }

                    if (event.status === 'locked') {
                        const locked = authStore.getLocked();

                        if (!locked) {
                            config.onNotification?.({
                                key: NotificationKey.LOCK,
                                text: c('Warning').t`Your session was locked.`,
                                type: 'info',
                            });
                        }

                        await authService.lock(LockMode.SESSION, { soft: true, broadcast: true });
                    }

                    if (event.status === 'not-allowed') {
                        if (event.error?.includes('two-factor-authentication-2fa')) {
                            config.onNotification?.({
                                text: '',
                                key: NotificationKey.ORG_MISSING_2FA,
                                type: 'error',
                                expiration: -1,
                            });
                        }

                        await authService.logout({ soft: true, broadcast: true });
                    }

                    if (event.status === 'missing-scope') config.onMissingScope?.();

                    break;
                }

                case 'refresh': {
                    const { data } = event;
                    if (authStore.getUID() === data.UID) {
                        /** The `onSessionRefresh` callback is invoked to persist the new tokens.
                         * If this callback throws an error, it is crucial to avoid updating the
                         * authentication store data. This precaution prevents potential inconsistencies
                         * between the store and persisted data. The provisional refresh token is confirmed
                         * only upon the initial use of the new access token. */
                        await config.onSessionRefresh?.(authStore.getLocalID(), data, true);
                        authStore.setSession(data);
                    }

                    break;
                }
            }
        }
    });

    return authService;
};

export type AuthService = ReturnType<typeof createAuthService>;
