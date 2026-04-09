import { useHistory } from 'react-router-dom';

import { useMachine } from '@xstate/react';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { OnLoginCallback } from '@proton/components/containers/app/interface';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import Layout from '../public/Layout';
import Main from '../public/Main';
import PublicHelpLink from '../public/PublicHelpLink';
import { UnauthedForgotPasswordWizard } from './UnauthedForgotPasswordWizard';
import {
    UnauthedForgotPasswordStateMachine,
    UnauthedForgotPasswordStateMachineTags,
} from './state-machine/UnauthedForgotPasswordStateMachine';

interface Props {
    onLogin: OnLoginCallback;
    toApp: APP_NAMES | undefined;
    setupVPN: boolean;
    loginUrl: string;
    productParam: ProductParam;
    onPreSubmit: () => Promise<void>;
    onStartAuth: () => Promise<void>;
}

export const UnauthedForgotPassword = ({
    toApp,
    loginUrl,
    onPreSubmit,
    onStartAuth,
    onLogin,
    setupVPN,
    productParam,
}: Props) => {
    const history = useHistory();
    const redirectToSignIn = () => history.push(loginUrl);

    const [snapshot, send, actorRef] = useMachine(
        UnauthedForgotPasswordStateMachine.provide({
            actions: {
                redirectToSignIn,
            },
        })
    );

    const handleBackStep = () => send({ type: 'decision.back' });

    return (
        <Layout
            toApp={toApp}
            hasDecoration={snapshot.value === 'entry'}
            onBack={handleBackStep}
            bottomRight={<PublicHelpLink />}
        >
            <Main>
                <UnauthedForgotPasswordWizard
                    actorRef={actorRef}
                    snapshot={snapshot}
                    send={send}
                    onPreSubmit={onPreSubmit}
                    onStartAuth={onStartAuth}
                    onLogin={onLogin}
                    setupVPN={setupVPN}
                    productParam={productParam}
                />
            </Main>
            {!snapshot.hasTag(UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn) && (
                <div className="text-center">
                    <Button size="large" color="norm" shape="ghost" className="mt-2" onClick={redirectToSignIn}>{c(
                        'Action'
                    ).t`Return to sign-in`}</Button>
                </div>
            )}
        </Layout>
    );
};
