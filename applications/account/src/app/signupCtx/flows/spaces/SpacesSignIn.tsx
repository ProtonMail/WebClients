import { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import LoaderPage from '@proton/components/containers/app/LoaderPage';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import type { OnLoginCallback } from '../../../content/authSession';
import type { Paths } from '../../../content/helper';
import SignInContainer from '../../../sign-in/SignInContainer';
import { getLoginMeta } from '../../../sign-in/loginPagesJson';
import SpacesAvailableGate from './components/SpacesAvailableGate';
import { getSpacesSignInLayout } from './components/SpacesSignInLayout';
import { getSpacesJoinUrl, getSpacesRedirectUrl } from './helpers/invite';
import { useInviteDetails } from './helpers/useInviteDetails';
import { useInviteeStatus } from './helpers/useInviteeStatus';

interface Props {
    toApp: APP_NAMES | undefined;
    toAppName: string | undefined;
    productParam: ProductParam;
    initialSearchParams?: URLSearchParams;
    paths: Paths;
    hasBack: boolean;
    handleLogin: OnLoginCallback;
    onGetActiveSessions: () => Promise<GetActiveSessionsResult>;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
}

const SpacesSignInContent = ({
    toApp,
    toAppName,
    productParam,
    initialSearchParams,
    paths,
    hasBack,
    handleLogin,
    onGetActiveSessions,
    onPreSubmit,
    onStartAuth,
}: Props) => {
    const history = useHistory();
    const location = useLocation();
    const [hashParams] = useState(() => new URLSearchParams(location.hash.replace(/^#/, '')));
    const inviteDetails = useInviteDetails(initialSearchParams?.get('preVerifiedAddressToken'));
    const orgJoinLink = hashParams.get('orgJoinLink');

    const username = initialSearchParams?.get('username') || undefined;

    const layout = useMemo(() => {
        if (inviteDetails.type !== 'loaded') {
            return getSpacesSignInLayout();
        }
        const { inviterDisplayName, inviterEmail, spaceName, spaceDescription } = inviteDetails.details;
        const inviter = inviterDisplayName || inviterEmail;
        return getSpacesSignInLayout(inviter ? { inviter, spaceName, spaceDescription } : undefined);
    }, [inviteDetails]);

    const inviteeStatus = useInviteeStatus({
        email: username,
        onGetActiveSessions,
    });
    const signedInUrl =
        inviteeStatus.type === 'signed-in' ? getSpacesRedirectUrl(orgJoinLink, inviteeStatus.localID) : undefined;

    useEffect(() => {
        if (signedInUrl) {
            replaceUrl(signedInUrl);
        }
    }, [signedInUrl]);

    if (inviteeStatus.type === 'loading' || inviteDetails.type === 'loading' || signedInUrl) {
        return <LoaderPage />;
    }

    return (
        <SignInContainer
            layout={layout}
            usernameReadOnly={!!username}
            showSignUpPrompt={!username}
            initialSearchParams={initialSearchParams}
            metaTags={getLoginMeta(toApp)}
            toAppName={toAppName}
            toApp={toApp}
            productParam={productParam}
            onLogin={async (session) => {
                const joinUrl = orgJoinLink ? getSpacesJoinUrl(orgJoinLink, session.data.localID) : undefined;
                if (joinUrl) {
                    replaceUrl(joinUrl);
                    return { state: 'complete' };
                }
                return handleLogin(session);
            }}
            onBack={hasBack ? () => history.push(SSO_PATHS.SWITCH) : undefined}
            setupVPN
            paths={paths}
            onPreSubmit={onPreSubmit}
            onStartAuth={onStartAuth}
        />
    );
};

const SpacesSignIn = (props: Props) => (
    <SpacesAvailableGate fallbackPath={SSO_PATHS.LOGIN}>
        <SpacesSignInContent {...props} />
    </SpacesAvailableGate>
);

export default SpacesSignIn;
