import { type EventObject, fromCallback, fromPromise } from 'xstate';

import type { ParsedUnprivatizationData } from '@proton/account/members/unprivatization';
import {
    parseUnprivatizationData,
    setupKeysWithUnprivatization,
    validateUnprivatizationData,
} from '@proton/account/members/unprivatization';
import { createPreAuthKTVerifier } from '@proton/key-transparency/shared/createPreAuthKTVerifier';
import { authJwt, getInfo } from '@proton/shared/lib/api/auth';
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getToAppFromSubscribed } from '@proton/shared/lib/authentication/apps';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { User } from '@proton/shared/lib/interfaces/User';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { getResetAddressesKeysV2 } from '@proton/shared/lib/keys/resetKeys';
import type { OrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';
import { getUnprivatizationContextData } from '@proton/shared/lib/keys/unprivatization/helper';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import type { AuthSession } from '../../content/authSession';
import { stripQueryParams } from '../jwt';
import { MissingTokenError } from './joinMagicLinkStateMachine';

/** What the link gives access to, read before the member sets a password. */
export interface JoinMagicLinkData {
    user: User;
    organizationData: OrganizationData;
    authApi: Api;
    addresses: Address[];
    parsedUnprivatizationData: ParsedUnprivatizationData;
    ktActivation: KeyTransparencyActivation;
}

export interface JoinMagicLinkServices {
    api: Api;
    unauthenticatedApi: UnauthenticatedApi;
    appName: APP_NAMES;
    toApp: APP_NAMES | undefined;
    getKtActivation: () => Promise<KeyTransparencyActivation>;
    onPreload: (() => void) | undefined;
    onPreSubmit: (() => Promise<void>) | undefined;
    login: (session: AuthSession) => Promise<unknown>;
}

export const createJoinMagicLinkActors = (services: JoinMagicLinkServices) => ({
    prepare: fromPromise<JoinMagicLinkData>(async () => {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = stripQueryParams(params.get('token'));
        services.onPreload?.();

        if (!token) {
            throw new MissingTokenError();
        }

        const silentApi = getSilentApi(services.api);
        const { UID, AccessToken } = await silentApi<{ UID: string; AccessToken: string }>(authJwt({ Token: token }));
        const authApi = getAuthAPI(UID, AccessToken, silentApi);

        await services.onPreSubmit?.();

        const [user, { organizationData, addresses, data: unprivatizationData }] = await Promise.all([
            getUser(authApi),
            getUnprivatizationContextData({ api: authApi }),
        ]);
        const parsedUnprivatizationData = await parseUnprivatizationData({ unprivatizationData, addresses });
        const ktActivation = await services.getKtActivation();
        await validateUnprivatizationData({
            ktUserContext: {
                ktActivation,
                appName: services.appName,
                getUser: async () => user,
                getUserKeys: async () => [], // User keys do not exist in this case
            },
            api: authApi,
            parsedUnprivatizationData,
            options: {
                validateRevision: true,
                newMemberCreation: true,
            },
        });
        return { user, organizationData, addresses, parsedUnprivatizationData, authApi, ktActivation };
    }),
    /** Releases the organization's logo when it's no longer shown. */
    holdLogo: fromCallback<EventObject, OrganizationData['logo'] | undefined>(
        ({ input }) =>
            () =>
                input?.cleanup()
    ),
    setUp: fromPromise<void, { data: JoinMagicLinkData | undefined; password: string }>(async ({ input }) => {
        if (!input.data) {
            throw new Error('missing data');
        }
        const { password } = input;
        const { user, authApi, addresses, parsedUnprivatizationData, ktActivation } = input.data;
        const preAuthKTVerifier = createPreAuthKTVerifier(ktActivation);

        const { passphrase, salt } = await generateKeySaltAndPassphrase(password);
        const { onSKLPublishSuccess, ...resetPayload } = await getResetAddressesKeysV2({
            addresses,
            passphrase,
            supportV6Keys: false, // pqc: TODO (future), based on admin key version or separate setting.
            preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        });
        if (!resetPayload.privateKeys || !onSKLPublishSuccess) {
            throw new Error('Missing keys payload');
        }

        await setupKeysWithUnprivatization({
            api: authApi,
            password,
            parsedUnprivatizationData,
            payload: {
                ...resetPayload,
                salt,
            },
        });

        await onSKLPublishSuccess();

        // A new member signs in right away: no second factor or second password yet, and the key password is
        // the one just derived, so there is nothing to unlock
        await services.unauthenticatedApi.startUnAuthFlow();
        const api = getSilentApi(services.unauthenticatedApi.apiCallback);
        const username = addresses?.[0]?.Email;
        const persistent = false;
        const { result: authResponse } = await loginWithFallback({
            api,
            credentials: { username, password },
            initialAuthInfo: await api<InfoResponse>(getInfo({ username })),
            persistent,
        });

        await preAuthKTVerifier.preAuthKTCommit(user.ID, api);

        const session = await persistSession({
            ...authResponse,
            api,
            keyPassword: passphrase,
            clearKeyPassword: password,
            persistent,
            User: await getUser(api),
            trusted: false,
            source: SessionSource.Proton,
        });

        const subscribedToApp = services.toApp || getToAppFromSubscribed(user);
        await services.login({
            data: session,
            loginPassword: password,
            flow: 'login',
            ...(subscribedToApp ? { appIntent: { app: subscribedToApp } } : {}),
        });
    }),
});

export type JoinMagicLinkActors = ReturnType<typeof createJoinMagicLinkActors>;
