import { useEffect, useLayoutEffect, useRef } from 'react';

import { SignInRoutes } from './routes/SignInRoutes';
import { signInRoutes } from './signInRoutes';
import { SignInContext } from './wizard/SignInContext';
import { useSignInProps } from './wizard/SignInProvider';

/** The sign-in's page: the screen the machines are on, inside the page's layout (`signInRoutes`). */
export const SignInWizard = () => {
    const { onError } = useSignInProps();
    const actorRef = SignInContext.useActorRef();

    const onErrorRef = useRef(onError);
    useLayoutEffect(() => {
        onErrorRef.current = onError;
    });
    useEffect(() => {
        const subscription = actorRef.on('error', ({ error }) => onErrorRef.current(error));
        return () => subscription.unsubscribe();
    }, [actorRef]);

    return <SignInRoutes routes={signInRoutes} />;
};
