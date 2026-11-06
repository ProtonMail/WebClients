import { useEffect } from 'react';

import { useMachine } from '@xstate/react';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';

import AccountLoaderPage from '../../AccountLoaderPage';
import type { OnLoginCallback } from '../authSession';
import { PublicAppContext } from '../state-machine/PublicAppContext';
import { usePublicAppServices } from '../state-machine/PublicAppServices';
import { runLogin } from '../state-machine/runLogin';
import type { OAuthPartnersCallbackState, OAuthPartnersInitiateState } from './oauthPartners';
import { createOAuthPartnersActors } from './oauthPartnersActors';
import { oauthPartnersStateMachine } from './oauthPartnersStateMachine';

interface Props {
    state: OAuthPartnersInitiateState | OAuthPartnersCallbackState;
}

const OAuthPartnersContainer = ({ state }: Props) => {
    const services = usePublicAppServices();
    const publicApp = PublicAppContext.useActorRef();
    const onLogin: OnLoginCallback = (session) => runLogin(publicApp, session);
    const onCredentials = ({ email, sessions }: { sessions?: GetActiveSessionsResult; email: string }) =>
        publicApp.send({ type: 'oauthPartners.credentialsRequested', email, sessions: sessions?.sessions });
    const { createNotification } = useNotifications();
    const [snapshot, , actorRef] = useMachine(
        oauthPartnersStateMachine.provide({
            actors: createOAuthPartnersActors({
                unauthenticatedApi: services.unauthenticatedApi,
                login: onLogin,
            }),
            actions: { continueWithCredentials: (_, data) => onCredentials(data) },
        }),
        { input: state }
    );

    useEffect(() => {
        const subscription = actorRef.on('notice.existingAccount', (event) => {
            const email = event.email ? `<${event.email}>` : '';
            createNotification({
                type: 'info',
                text: c('sso')
                    .t`The email address ${email} already exists in ${BRAND_NAME}. Sign in with your ${BRAND_NAME} credentials to continue.`,
            });
        });
        return () => subscription.unsubscribe();
    }, [actorRef, createNotification]);

    if (snapshot.matches('failed')) {
        return (
            <StandardErrorPage>
                <div className="text-center">
                    <div className="mb-4">{getNonEmptyErrorMessage(snapshot.context.error)}</div>
                    <Button color="norm" onClick={() => onCredentials({ email: '' })}>
                        {c('Action').t`Sign in with ${BRAND_NAME}`}
                    </Button>
                </div>
            </StandardErrorPage>
        );
    }

    return <AccountLoaderPage />;
};

export default OAuthPartnersContainer;
