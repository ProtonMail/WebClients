import { useLayoutEffect, useRef, useState } from 'react';

import { useConfig } from '@proton/app-context/useConfig';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { normalizeProduct } from '@proton/shared/lib/apps/product';
import noop from '@proton/utils/noop';

import type { OnLoginCallback } from '../content/authSession';
import type { Paths } from '../content/helper';
import { useGetAccountKTActivation } from '../useGetAccountKTActivation';
import { SignInStateMachine } from './state-machine/SignInStateMachine';
import { type SignInActorServices, createSignInActors } from './state-machine/signInActors';
import { createCredentialsActors } from './steps/credentials/state-machine/credentialsActors';
import { credentialsStateMachine } from './steps/credentials/state-machine/credentialsStateMachine';
import { createPasswordAccountActors } from './steps/password-account/state-machine/passwordAccountActors';
import { passwordAccountStateMachine } from './steps/password-account/state-machine/passwordAccountStateMachine';
import { createSSOActors } from './steps/sso/state-machine/ssoActors';
import { ssoStateMachine } from './steps/sso/state-machine/ssoStateMachine';

/** Sends SSO users of other apps (VPN) to account's SSO page, which can open the provider window. */
const redirectToAccountSSO = ({
    externalRedirect,
    productParam,
    username,
}: {
    externalRedirect?: string;
    productParam?: ProductParam;
    username: string;
}) => {
    const url = new URL('https://account.proton.me/sso/login');
    url.searchParams.set('username', username);
    url.searchParams.set('flow', 'redirect');
    if (externalRedirect && externalRedirect !== '/') {
        url.searchParams.set('continueTo', externalRedirect);
    }
    const normalizedProductParam = normalizeProduct(productParam);
    if (normalizedProductParam) {
        url.searchParams.set('product', normalizedProductParam);
    }
    window.location.assign(url.toString());
};

interface Options {
    productParam: ProductParam;
    externalRedirect: string | undefined;
    onPreSubmit: (() => Promise<void>) | undefined;
    onStartAuth: () => Promise<void>;
    onLogin: OnLoginCallback;
    onBack: (() => void) | undefined;
    paths: Paths;
}

/**
 * The sign-in machine with its actors built from the app's services (API, config, callbacks). It's built once, and a
 * running child machine keeps the implementations it was spawned with, so the props are read through a ref: `onLogin`
 * and `paths` depend on page state (like the fork) that can change while the page is open.
 */
export const useSignInMachine = (options: Options) => {
    const { APP_NAME } = useConfig();
    const api = useSilentApi();
    const getKtActivation = useGetAccountKTActivation();
    const latestRef = useRef(options);
    // Updated once the render commits, before any effect or event handler can reach the actors
    useLayoutEffect(() => {
        latestRef.current = options;
    });

    const [machine] = useState(() => {
        // The preparation runs once per page
        let preparation: Promise<void> | undefined;

        const services: SignInActorServices = {
            api,
            appName: APP_NAME,
            get productParam() {
                return latestRef.current.productParam;
            },
            getKtActivation,
            prepare: () => {
                // Warms up the sign-in; best-effort, so a failure doesn't block it
                preparation ??= api(queryAvailableDomains('login')).then(noop, noop);
                return preparation;
            },
            startAuth: async () => {
                await latestRef.current.onPreSubmit?.();
                await latestRef.current.onStartAuth();
            },
            onStartAuth: () => latestRef.current.onStartAuth(),
            onLogin: (session) => latestRef.current.onLogin(session),
        };

        const leaveTo = (path: string, username: string) =>
            window.location.assign(`${path}?${new URLSearchParams({ username }).toString()}`);

        return SignInStateMachine.provide({
            actors: {
                ...createSignInActors(services),
                credentialsFlow: credentialsStateMachine.provide({
                    actors: createCredentialsActors(services),
                    actions: {
                        navigateBack: () => latestRef.current.onBack?.(),
                        redirectToAccountSSO: (_, { username }) =>
                            redirectToAccountSSO({
                                externalRedirect: latestRef.current.externalRedirect,
                                productParam: latestRef.current.productParam,
                                username,
                            }),
                    },
                }),
                passwordAccountFlow: passwordAccountStateMachine.provide({
                    actors: createPasswordAccountActors(services),
                    actions: {
                        goToResetPassword: (_, { username }) => leaveTo(latestRef.current.paths.reset, username),
                    },
                }),
                ssoFlow: ssoStateMachine.provide({ actors: createSSOActors(services) }),
            },
        });
    });

    return machine;
};
