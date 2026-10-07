import { useLayoutEffect, useRef, useState } from 'react';

import useLocalState from '@proton/components/hooks/useLocalState';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import type { ProductParam } from '@proton/shared/lib/apps/product';

import type { OnLoginCallback } from '../content/authSession';
import { defaultPersistentKey } from '../public/helper';
import { useResetPasswordTelemetry } from '../reset/resetPasswordTelemetry';
import { useGetAccountKTActivation } from '../useGetAccountKTActivation';
import { UnauthedForgotPasswordStateMachine } from './state-machine/UnauthedForgotPasswordStateMachine';
import { type ForgotPasswordServices, createForgotPasswordActors } from './state-machine/forgotPasswordActors';

interface Options {
    onPreSubmit: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    setupVPN: boolean;
    /** With a username, the sign-in form starts with it. */
    redirectToSignIn: (username?: string) => void;
}

/**
 * The forgot-password machine with its requests built from the app's services (API, callbacks, telemetry). It's
 * built once, and an invoked request keeps the implementation it was started with, so the props are read through a
 * ref.
 */
export const useForgotPasswordMachine = (options: Options) => {
    const api = useSilentApi();
    const getKtActivation = useGetAccountKTActivation();
    const [persistent] = useLocalState(false, defaultPersistentKey);
    const telemetry = useResetPasswordTelemetry({ variant: 'B' });
    const latest = { ...options, persistent, telemetry };
    const latestRef = useRef(latest);
    // Updated once the render commits, before any effect or event handler can reach the actors
    useLayoutEffect(() => {
        latestRef.current = latest;
    });

    const [machine] = useState(() => {
        const services: ForgotPasswordServices = {
            api,
            prepareAttempt: async () => {
                await latestRef.current.onPreSubmit();
                await latestRef.current.onStartAuth();
            },
            getPersistent: () => latestRef.current.persistent,
            getKtActivation,
            get productParam() {
                return latestRef.current.productParam;
            },
            get setupVPN() {
                return latestRef.current.setupVPN;
            },
            onLogin: (session) => latestRef.current.onLogin(session),
            get telemetry() {
                return latestRef.current.telemetry;
            },
        };

        return UnauthedForgotPasswordStateMachine.provide({
            actors: createForgotPasswordActors(services),
            actions: {
                // However the user leaves, the sign-in form starts with the username they gave, if any
                redirectToSignIn: ({ context }) => latestRef.current.redirectToSignIn(context.username),
            },
        });
    });

    return machine;
};
