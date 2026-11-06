import { useEffect, useState } from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import LoaderPage from '@proton/components/containers/app/LoaderPage';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import { CYCLE } from '@proton/payments/core/constants';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { SignupHumanVerification, SignupType } from '../../../signup/interfaces';
import { type BaseSignupContextProps, SignupContextProvider, useSignup } from '../../context/SignupContext';
import SpacesAvailableGate from './components/SpacesAvailableGate';
import {
    getSpacesInviteFromSearchParams,
    getSpacesJoinUrl,
    getSpacesRedirectUrl,
    getSpacesSignInUrl,
} from './helpers/invite';
import { useInviteDetails } from './helpers/useInviteDetails';
import { useInviteeStatus } from './helpers/useInviteeStatus';
import AccountDetailsStep from './steps/AccountDetailsStep';

type Step = 'account-details' | 'creating-account';

const SpacesSignupInner = ({
    signInUrl,
    isInvited,
    inviter,
    spaceName,
    spaceDescription,
}: {
    signInUrl: string;
    isInvited: boolean;
    inviter?: string;
    spaceName?: string;
    spaceDescription?: string;
}) => {
    const [step, setStep] = useState<Step>('account-details');
    const signup = useSignup();
    const notifyError = useNotifyErrorHandler();

    return (
        <>
            {step === 'account-details' && (
                <AccountDetailsStep
                    signInUrl={signInUrl}
                    isInvited={isInvited}
                    inviter={inviter}
                    spaceName={spaceName}
                    spaceDescription={spaceDescription}
                    onSuccess={async () => {
                        try {
                            await signup.createUser();
                            setStep('creating-account');

                            await signup.setupUser();

                            await signup.login();
                        } catch (error) {
                            notifyError(error);
                        }
                    }}
                />
            )}

            {step === 'creating-account' && <LoaderPage text={c('Info').t`Creating your account`} />}
        </>
    );
};

const SpacesSignupContent = (props: BaseSignupContextProps) => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const linkInvite = getSpacesInviteFromSearchParams(searchParams, hashParams);
    const inviteDetails = useInviteDetails(linkInvite?.data.preVerifiedAddressToken);
    const invite = inviteDetails.type === 'loaded' ? linkInvite : undefined;
    const { inviterDisplayName, inviterEmail, spaceName, spaceDescription } =
        inviteDetails.type === 'loaded' ? inviteDetails.details : {};
    const inviteeEmail = invite?.data.invitee ?? (searchParams.get('invitee') || undefined);
    const orgJoinLink = invite?.data.orgJoinLink ?? hashParams.get('orgJoinLink');
    const inviteeStatus = useInviteeStatus({
        email: inviteeEmail,
        onGetActiveSessions: props.onGetActiveSessions,
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

    const signInUrl = getSpacesSignInUrl({
        loginUrl: props.loginUrl,
        invitee: inviteeEmail,
        preVerifiedAddressToken: invite?.data.preVerifiedAddressToken,
        orgJoinLink,
    });

    return (
        <SignupContextProvider
            {...props}
            app={APPS.PROTONSPACES}
            flowId={invite ? 'spaces-invite' : 'spaces-free'}
            hvMode={SignupHumanVerification.DEFERRED}
            invite={invite}
            onLogin={async (session) => {
                const joinUrl = invite ? getSpacesJoinUrl(invite.data.orgJoinLink, session.localID) : undefined;
                if (joinUrl) {
                    replaceUrl(joinUrl);
                    return;
                }
                await props.handleLogin({ data: session, flow: 'signup', appIntent: { app: APPS.PROTONSPACES } });
            }}
            paymentsDataConfig={{
                availablePlans: [],
                plan: {
                    planIDs: {},
                    currency: undefined,
                    cycle: CYCLE.YEARLY,
                    coupon: undefined,
                },
                telemetryContext: 'ctx-signup-spaces',
            }}
            accountFormDataConfig={{
                defaultEmail: invite?.data.invitee ?? searchParams.get('invitee') ?? '',
                availableSignupTypes: invite
                    ? new Set([SignupType.External])
                    : new Set([SignupType.External, SignupType.Proton]),
            }}
        >
            <SpacesSignupInner
                signInUrl={signInUrl}
                isInvited={!!invite}
                inviter={inviterDisplayName || inviterEmail}
                spaceName={spaceName}
                spaceDescription={spaceDescription}
            />
        </SignupContextProvider>
    );
};

const SpacesSignup = (props: BaseSignupContextProps) => (
    <SpacesAvailableGate fallback={<Redirect to={SSO_PATHS.SIGNUP} />}>
        <SpacesSignupContent {...props} />
    </SpacesAvailableGate>
);

export default SpacesSignup;
