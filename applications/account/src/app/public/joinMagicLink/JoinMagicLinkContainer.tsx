import { Fragment, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { useMachine } from '@xstate/react';
import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Href } from '@proton/atoms/Href/Href';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import GenericError from '@proton/components/containers/error/GenericError';
import NotificationButton from '@proton/components/containers/notifications/NotificationButton';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { APPS, type APP_NAMES, BRAND_NAME, SSO_PATHS } from '@proton/shared/lib/constants';

import SetPasswordWithPolicyForm from '../../components/password-forms/SetPasswordWithPolicyForm';
import type { OnLoginCallback } from '../../content/authSession';
import { getLocaleTermsURL } from '../../content/helper';
import { usePublicAppAuth } from '../../content/publicAppAuth';
import { PublicAppContext } from '../../content/state-machine/PublicAppContext';
import { usePublicAppServices } from '../../content/state-machine/PublicAppServices';
import { getPublicAppPaths, selectPreAppIntent } from '../../content/state-machine/publicAppStateMachine';
import { runLogin } from '../../content/state-machine/runLogin';
import { useGetAccountKTActivation } from '../../useGetAccountKTActivation';
import ExpiredError from '../ExpiredError';
import JoinOrganizationAdminItem from '../JoinOrganizationAdminItem';
import Layout from '../Layout';
import Main from '../Main';
import { createJoinMagicLinkActors } from './joinMagicLinkActors';
import { joinMagicLinkStateMachine } from './joinMagicLinkStateMachine';

const getTerms = (app: APP_NAMES) => {
    const terms = (
        <Fragment key="terms">
            <br />
            <Href href={getLocaleTermsURL(app)}>{
                // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                c('new_plans: signup').t`terms and conditions`
            }</Href>
        </Fragment>
    );

    // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
    return c('new_plans: signup').jt`By creating a ${BRAND_NAME} account, you agree to our ${terms}`;
};

const JoinMagicLinkContainer = () => {
    const services = usePublicAppServices();
    const { onPreSubmit, onPreload } = usePublicAppAuth();
    const history = useHistory();
    const publicApp = PublicAppContext.useActorRef();
    const toApp = PublicAppContext.useSelector(selectPreAppIntent);
    const onLogin: OnLoginCallback = (session) => runLogin(publicApp, session);
    const onUsed = () => {
        const { context } = publicApp.getSnapshot();
        history.replace(
            (context.activeSessions || []).length >= 1 ? SSO_PATHS.SWITCH : getPublicAppPaths(context).login
        );
    };
    const { APP_NAME: appName } = useConfig();
    const handleError = useErrorHandler();
    const { createNotification } = useNotifications();
    const getKtActivation = useGetAccountKTActivation();
    const [snapshot, send, actorRef] = useMachine(
        joinMagicLinkStateMachine.provide({
            actors: createJoinMagicLinkActors({
                api: services.api,
                unauthenticatedApi: services.unauthenticatedApi,
                appName,
                toApp,
                getKtActivation,
                onPreload,
                onPreSubmit,
                login: onLogin,
            }),
            actions: { redirectToSignIn: onUsed },
        })
    );

    useEffect(() => {
        const subscriptions = [
            actorRef.on('error', ({ error }) => handleError(error)),
            actorRef.on('link.used', ({ message }) => createNotification({ type: 'info', text: message })),
            actorRef.on('session.expired', () =>
                createNotification({
                    type: 'error',
                    text: (
                        <>
                            <span>{c('Error').t`Session expired. Please refresh the page.`}</span>
                            <NotificationButton onClick={() => window.location.reload()}>
                                {c('Action').t`Refresh the page`}
                            </NotificationButton>
                        </>
                    ),
                })
            ),
        ];
        return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
    }, [actorRef, handleError, createNotification]);

    if (snapshot.matches('failed')) {
        return (
            <div className="absolute inset-center text-center">
                {(() => {
                    if (snapshot.context.error === 'expired') {
                        return <ExpiredError type="magic-link" />;
                    }
                    if (snapshot.context.error === 'used') {
                        return <ExpiredError type="magic-link-used" />;
                    }
                    return <GenericError />;
                })()}
            </div>
        );
    }

    if (snapshot.matches('preparing')) {
        return (
            <div className="absolute inset-center text-center">
                <CircleLoader size="large" />
            </div>
        );
    }

    const data = snapshot.context.data;
    const { adminEmail, username, organizationName } = ((): {
        type: 'public' | 'private' | 'gsso';
        adminEmail: string;
        username: string;
        organizationName: string;
    } => {
        if (!data) {
            return {
                type: 'public' as const,
                adminEmail: '',
                username: '',
                organizationName: '',
            };
        }

        const {
            addresses,
            parsedUnprivatizationData,
            organizationData: { organization },
        } = data;
        return {
            type: parsedUnprivatizationData.type,
            adminEmail: parsedUnprivatizationData.payload.unprivatizationData.AdminEmail,
            username: addresses?.[0]?.Email || '',
            organizationName: organization.Name,
        };
    })();

    return (
        <Layout hasDecoration={true} toApp={toApp}>
            <Main>
                <JoinOrganizationAdminItem
                    organizationLogoUrl={data?.organizationData.logo?.url}
                    organizationName={organizationName}
                    adminEmail={adminEmail}
                />
                <hr className="my-6 border-bottom border-weak" />
                <SetPasswordWithPolicyForm
                    passwordPolicies={data?.organizationData.passwordPolicies ?? []}
                    onSubmit={({ password }) => send({ type: 'password.submitted', password })}
                    submitting={snapshot.matches({ joining: 'settingUp' })}
                    type="create"
                >
                    <InputFieldTwo
                        id="username"
                        bigger
                        label={c('Label').t`Username`}
                        readOnly
                        disableChange={true}
                        value={username}
                    />
                </SetPasswordWithPolicyForm>
                <div className="color-weak text-sm text-center mt-4">{getTerms(toApp || APPS.PROTONACCOUNT)}</div>
            </Main>
        </Layout>
    );
};

export default JoinMagicLinkContainer;
