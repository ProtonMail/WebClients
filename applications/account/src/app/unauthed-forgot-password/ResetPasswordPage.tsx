import { useEffect, useLayoutEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { OnLoginCallback } from '../content/authSession';
import Layout from '../public/Layout';
import Main from '../public/Main';
import { useResetPasswordTelemetry } from '../reset/resetPasswordTelemetry';
import { type MetaTags, useMetaTags } from '../useMetaTags';
import { UnauthedForgotPasswordWizard } from './UnauthedForgotPasswordWizard';
import {
    selectCanGoBack,
    selectHideReturnToSignIn,
    selectOnEntry,
} from './state-machine/UnauthedForgotPasswordStateMachine';
import { useForgotPasswordMachine } from './useForgotPasswordMachine';
import { ForgotPasswordContext } from './wizard/ForgotPasswordContext';

interface Props {
    onLogin: OnLoginCallback;
    toApp: APP_NAMES | undefined;
    setupVPN: boolean;
    loginUrl: string;
    productParam: ProductParam;
    onPreSubmit: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    metaTags: MetaTags;
}

/** The page around the steps: its back button and decoration follow the machine's state, and it shows its errors. */
const ResetPasswordLayout = ({
    toApp,
    onReturnToSignIn,
}: {
    toApp: APP_NAMES | undefined;
    onReturnToSignIn: () => void;
}) => {
    const actorRef = ForgotPasswordContext.useActorRef();
    const onEntry = ForgotPasswordContext.useSelector(selectOnEntry);
    const canGoBack = ForgotPasswordContext.useSelector(selectCanGoBack);
    const hideReturnToSignIn = ForgotPasswordContext.useSelector(selectHideReturnToSignIn);

    const errorHandler = useErrorHandler();
    const errorHandlerRef = useRef(errorHandler);
    useLayoutEffect(() => {
        errorHandlerRef.current = errorHandler;
    });
    useEffect(() => {
        const subscription = actorRef.on('error', ({ error }) => errorHandlerRef.current(error));
        return () => subscription.unsubscribe();
    }, [actorRef]);

    // Back, only where the step has somewhere to go back to: the page shows it on small screens, the step's heading on
    // larger ones
    const onBack = canGoBack ? () => actorRef.send({ type: 'decision.back' }) : undefined;

    return (
        <Layout toApp={toApp} hasDecoration={onEntry} onBack={onBack}>
            <Main>
                <UnauthedForgotPasswordWizard onBack={onBack} />
            </Main>
            {!hideReturnToSignIn && (
                <div className="text-center">
                    <Button size="large" color="norm" shape="ghost" className="mt-2" onClick={onReturnToSignIn}>
                        {c('Action').t`Return to sign-in`}
                    </Button>
                </div>
            )}
        </Layout>
    );
};

export const ResetPasswordPage = ({
    toApp,
    loginUrl,
    onPreSubmit,
    onStartAuth,
    onLogin,
    setupVPN,
    productParam,
    metaTags,
}: Props) => {
    useMetaTags(metaTags);
    const history = useHistory();
    const redirectToSignIn = () => history.push(loginUrl);
    const { sendResetPasswordPageLoad, sendResetPasswordPageExit } = useResetPasswordTelemetry({ variant: 'B' });
    const machine = useForgotPasswordMachine({
        onPreSubmit,
        onStartAuth,
        onLogin,
        productParam,
        setupVPN,
        redirectToSignIn,
    });

    useEffect(() => {
        sendResetPasswordPageLoad();
        return () => {
            sendResetPasswordPageExit();
        };
    }, []);

    return (
        <ForgotPasswordContext.Provider logic={machine}>
            <ResetPasswordLayout toApp={toApp} onReturnToSignIn={redirectToSignIn} />
        </ForgotPasswordContext.Provider>
    );
};
