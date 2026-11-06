import { fromPromise } from 'xstate';

import { queryScopes } from '@proton/shared/lib/api/auth';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { getSettings } from '@proton/shared/lib/api/settings';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces/UserSettings';
import { srpAuth } from '@proton/shared/lib/srp';

import type { AuthSession } from '../authSession';
import { withInterruption } from '../interruptions';
import { handleReAuthKeyPassword } from './reAuthKeyPassword';
import type { ReAuthState } from './reauthContainerState';

export interface ReAuthServices {
    /** The session's API. */
    api: Api;
    /** Loads the crypto worker before the first request. */
    preSubmit: () => Promise<void>;
    login: (session: AuthSession) => Promise<unknown>;
}

export const createReAuthActors = ({ api, preSubmit, login }: ReAuthServices) => {
    const loginReAuthenticated = (session: AuthSession) => login(withInterruption(session, 'reauth'));

    const unlockAndLogin = async (state: ReAuthState, keyPassword: string, salts: KeySalt[]) => {
        const session = await handleReAuthKeyPassword({
            authSession: state.session,
            api,
            User: state.session.data.User,
            clearKeyPassword: keyPassword,
            salts,
        });
        await loginReAuthenticated(session);
    };

    return {
        preSubmit: fromPromise(preSubmit),
        /** Checks the password; signs in, or returns the salts when the keys have their own password. */
        submitPassword: fromPromise<
            { unlockWithSalts: KeySalt[] | undefined },
            { state: ReAuthState; password: string }
        >(async ({ input: { state, password } }) => {
            await preSubmit();
            await srpAuth({ api, credentials: { password }, config: { ...queryUnlock(), silence: true } });

            if (
                state.reAuthType === 'default' ||
                !!state.session.data.offlineKey ||
                !state.session.data.User.Keys.length
            ) {
                await loginReAuthenticated(state.session);
                return { unlockWithSalts: undefined };
            }

            const [{ UserSettings }, salts] = await Promise.all([
                api<{ UserSettings: UserSettings }>(getSettings()),
                api<{ KeySalts: KeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts),
            ]);

            if (UserSettings.Password.Mode === SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE) {
                await unlockAndLogin(state, password, salts);
                return { unlockWithSalts: undefined };
            }
            return { unlockWithSalts: salts };
        }),
        unlockKeys: fromPromise<void, { state: ReAuthState; keyPassword: string; salts: KeySalt[] }>(
            async ({ input: { state, keyPassword, salts } }) => {
                await preSubmit();
                await wait(500);
                await unlockAndLogin(state, keyPassword, salts);
            }
        ),
        /**
         * The key salts of an SSO session, which a locked session can't read: undefined until the identity provider
         * unlocks it. This container is public, so the API's own unlock handling isn't set up.
         */
        fetchSSOSalts: fromPromise<KeySalt[] | undefined, KeySalt[] | undefined>(async ({ input: cachedSalts }) => {
            if (cachedSalts?.length) {
                return cachedSalts;
            }
            const { Scopes } = await api<{ Scopes: string[] }>(queryScopes());
            if (!Scopes.includes('locked')) {
                return;
            }
            const { KeySalts } = await api<{ KeySalts: KeySalt[] }>({
                ...getKeySalts(),
                ignoreHandler: [HTTP_ERROR_CODES.UNLOCK],
            });
            return KeySalts;
        }),
        loginWithIdP: fromPromise<void, ReAuthState>(({ input: state }) =>
            loginReAuthenticated(state.session).then(() => {})
        ),
    };
};

export type ReAuthActors = ReturnType<typeof createReAuthActors>;
