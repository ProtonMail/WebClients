import { useEffect, useLayoutEffect, useRef } from 'react';

import { signInStepRegistry } from './signInStepRegistry';
import { SignInContext } from './wizard/SignInContext';
import { useSignInProps } from './wizard/SignInProvider';

export const SignInWizard = () => {
    const { onError } = useSignInProps();
    const actorRef = SignInContext.useActorRef();
    // The machine's `step` (not its state value) picks the screen, so the current step stays up while the machine works.
    const step = SignInContext.useSelector((snapshot) => snapshot.context.step);

    const onErrorRef = useRef(onError);
    useLayoutEffect(() => {
        onErrorRef.current = onError;
    });
    useEffect(() => {
        const subscription = actorRef.on('error', ({ error }) => onErrorRef.current(error));
        return () => subscription.unsubscribe();
    }, [actorRef]);

    const Step = signInStepRegistry[step];
    return <Step />;
};
