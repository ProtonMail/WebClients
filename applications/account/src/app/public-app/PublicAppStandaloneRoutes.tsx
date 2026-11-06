import type { ReactNode } from 'react';
import { Route, Switch } from 'react-router-dom';

import { c } from 'ttag';

import UnauthenticatedApiProvider from '@proton/components/containers/api/UnauthenticatedApiProvider';
import { SSO_PATHS } from '@proton/shared/lib/constants';

import AccountLoaderPage from '../AccountLoaderPage';
import AuthDesktop from './fork/AuthDesktop';
import AuthExtension from './fork/AuthExtension';
import ExternalSSOConsumer from './fork/ExternalSSOConsumer';
import { UNAUTHENTICATED_ROUTES } from './helper';
import useLocationWithoutLocale from './hooks/useLocationWithoutLocale';
import OAuthPartnersContainer from './oauthPartners/OAuthPartnersContainer';
import { PassAccountOnboarding } from './pass/PassAccountOnboarding';
import { PassExtensionOnboarding } from './pass/PassExtensionOnboarding';
import CallScheduledPage from './standalone/CallScheduledPage';
import CloseTicketContainer from './standalone/CloseTicketContainer';
import DisableAccountContainer from './standalone/DisableAccountContainer';
import EmailForwardingContainer, { EmailForwardingRequest } from './standalone/EmailForwardingContainer';
import EmailUnsubscribeContainer from './standalone/EmailUnsubscribeContainer';
import GroupInviteContainer, { GroupInviteRequest } from './standalone/GroupInviteContainer';
import GroupMembershipsContainer from './standalone/GroupMembershipsContainer';
import InboxDesktopFreeTrialEnded from './standalone/InboxDesktopFreeTrialEnded';
import RemoveEmailContainer from './standalone/RemoveEmailContainer';
import VerifyEmailContainer from './standalone/VerifyEmailContainer';
import { PublicAppContext } from './state-machine/PublicAppContext';
import { usePublicAppServices } from './state-machine/PublicAppServices';

/** The pages that render outside the public app's providers; anything else renders `children`. */
const PublicAppStandaloneRoutes = ({ children }: { children: ReactNode }) => {
    const services = usePublicAppServices();
    const location = useLocationWithoutLocale();
    const publicApp = PublicAppContext.useActorRef();
    const locationState = PublicAppContext.useSelector((state) => state.context.locationState);
    const loader = <AccountLoaderPage />;

    return (
        <Switch location={location}>
            <Route path={[SSO_PATHS.EXTERNAL_SSO_LOGIN, SSO_PATHS.EXTERNAL_SSO_REAUTH]}>
                <ExternalSSOConsumer
                    onOAuthLogin={({ token, uid }) =>
                        publicApp.send({ type: 'externalSSO.partnerSignedIn', token, uid })
                    }
                    onLogin={(data) => publicApp.send({ type: 'externalSSO.tokenReceived', ...data })}
                >
                    {loader}
                </ExternalSSOConsumer>
            </Route>
            <Route path={`${UNAUTHENTICATED_ROUTES.UNSUBSCRIBE}/:subscriptions?`}>
                <EmailUnsubscribeContainer />
            </Route>
            <Route path={`${UNAUTHENTICATED_ROUTES.EMAIL_FORWARDING}/accept`}>
                <EmailForwardingContainer request={EmailForwardingRequest.Accept} />
            </Route>
            <Route path={`${UNAUTHENTICATED_ROUTES.EMAIL_FORWARDING}/decline`}>
                <EmailForwardingContainer request={EmailForwardingRequest.Decline} />
            </Route>
            <Route path={`${UNAUTHENTICATED_ROUTES.GROUP_INVITE}/accept`}>
                <GroupInviteContainer request={GroupInviteRequest.Accept} />
            </Route>
            <Route path={`${UNAUTHENTICATED_ROUTES.GROUP_INVITE}/decline`}>
                <GroupInviteContainer request={GroupInviteRequest.Decline} />
            </Route>
            <Route path={`${UNAUTHENTICATED_ROUTES.GROUP_INVITE}/manage`}>
                <GroupMembershipsContainer />
            </Route>
            <Route path={UNAUTHENTICATED_ROUTES.CLOSE_TICKET}>
                <UnauthenticatedApiProvider unauthenticatedApi={services.unauthenticatedApi}>
                    <CloseTicketContainer />
                </UnauthenticatedApiProvider>
            </Route>
            <Route path={UNAUTHENTICATED_ROUTES.VERIFY_EMAIL}>
                <VerifyEmailContainer />
            </Route>
            <Route path={UNAUTHENTICATED_ROUTES.REMOVE_EMAIL}>
                <RemoveEmailContainer />
            </Route>
            <Route path={UNAUTHENTICATED_ROUTES.DISABLE_ACCOUNT}>
                <DisableAccountContainer />
            </Route>
            <Route path={UNAUTHENTICATED_ROUTES.TRIAL_ENDED}>
                <InboxDesktopFreeTrialEnded />
            </Route>
            <Route path={UNAUTHENTICATED_ROUTES.MSP_SETTING_UP_ACCESS}>
                <AccountLoaderPage text={c('Info').t`Setting up your access…`} />
            </Route>
            {locationState?.type === 'auth-ext' && (
                <Route path="/auth-ext">
                    <AuthExtension state={locationState.payload} />
                </Route>
            )}
            {locationState?.type === 'auth-desktop' && (
                <Route path="/auth-desktop">
                    <AuthDesktop state={locationState.payload} />
                </Route>
            )}
            {locationState?.type === 'oauth-partners' && (
                <Route path={SSO_PATHS.OAUTH_PARTNERS}>
                    <OAuthPartnersContainer state={locationState.payload} />
                </Route>
            )}
            <Route path="/call-scheduled">
                <CallScheduledPage />
            </Route>
            <Route path={SSO_PATHS.PASS_EXTENSION_ONBOARDING}>
                <PassExtensionOnboarding />
            </Route>
            <Route path={SSO_PATHS.PASS_ACCOUNT_ONBOARDING}>
                <PassAccountOnboarding />
            </Route>
            <Route path="*">{children}</Route>
        </Switch>
    );
};

export default PublicAppStandaloneRoutes;
