import { type ComponentProps, type ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import LoaderPage from '@proton/components/containers/app/LoaderPage';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { PublicAppContext } from '../../../content/state-machine/PublicAppContext';
import SignInContainer from '../../../sign-in/SignInContainer';
import SpacesAvailableGate from './components/SpacesAvailableGate';
import { getSpacesSignInLayout } from './components/SpacesSignInLayout';
import { getSpacesJoinUrl, getSpacesRedirectUrl } from './helpers/invite';
import { useInviteDetails } from './helpers/useInviteDetails';

type Props = ComponentProps<typeof SignInContainer>;

/** The public app's sign-in, with the Spaces invite: its layout, the invitee's username and the join link. */
const SpacesSignInContent = (props: Props) => {
    const { initialSearchParams, onLogin } = props;
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

    // The page opens after the machine has read the browser's sessions, so the invitee's is already known
    const signedInLocalID = PublicAppContext.useSelector(({ context }) =>
        username
            ? context.activeSessions?.find(
                  ({ remote }) => remote.PrimaryEmail?.toLowerCase() === username.toLowerCase()
              )?.persisted.localID
            : undefined
    );
    const signedInUrl = signedInLocalID === undefined ? undefined : getSpacesRedirectUrl(orgJoinLink, signedInLocalID);

    useEffect(() => {
        if (signedInUrl) {
            replaceUrl(signedInUrl);
        }
    }, [signedInUrl]);

    if (inviteDetails.type === 'loading' || signedInUrl) {
        return <LoaderPage />;
    }

    return (
        <SignInContainer
            {...props}
            layout={layout}
            usernameReadOnly={!!username}
            showSignUpPrompt={!username}
            onLogin={async (session) => {
                const joinUrl = orgJoinLink ? getSpacesJoinUrl(orgJoinLink, session.data.localID) : undefined;
                if (joinUrl) {
                    replaceUrl(joinUrl);
                    return { state: 'complete' };
                }
                return onLogin(session);
            }}
        />
    );
};

const SpacesSignIn = ({ fallback, ...props }: Props & { fallback: ReactNode }) => (
    <SpacesAvailableGate fallback={fallback}>
        <SpacesSignInContent {...props} />
    </SpacesAvailableGate>
);

export default SpacesSignIn;
