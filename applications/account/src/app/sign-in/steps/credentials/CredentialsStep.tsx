import { useEffect } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { IcUser } from '@proton/icons/icons/IcUser';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

import { getContinueToString } from '../../../public/helper';
import PorkbunHeader from '../../../single-signup-v2/mail/PorkbunHeader';
import { AuthType } from '../../auth/interface';
import { SignInStepLayout } from '../../components/SignInStepLayout';
import { SignInContext } from '../../wizard/SignInContext';
import { useSignInProps } from '../../wizard/SignInProvider';
import { CredentialsContext } from './CredentialsContext';
import LoginForm from './LoginForm';
import Testflight from './Testflight';
import { selectAuthType } from './state-machine/credentialsStateMachine';

const CredentialsScreen = () => {
    const { toAppName, testflight, isPorkbun } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const authType = CredentialsContext.useSelector(selectAuthType);
    const username = CredentialsContext.useSelector((snapshot) => snapshot.context.username);
    const canNavigateBack = CredentialsContext.useSelector((snapshot) => snapshot.context.canNavigateBack);

    // Back to the username works until the password is accepted; after that the sign-in may complete and leave the page
    const canGoBackToUsername = CredentialsContext.useSelector((snapshot) => snapshot.can({ type: 'decision.back' }));
    const goBack = () => actorRef.send({ type: 'decision.back' });
    // Back is ignored while a request runs (like main) and once the password is accepted; the button stays so the
    // layout doesn't jump
    const handleBack = authType === AuthType.AutoSrp || canNavigateBack ? goBack : undefined;

    const titles = (() => {
        if (testflight === 'vpn') {
            const app = `${VPN_APP_NAME} iOS`;
            return {
                title: c('Title').t`Sign in to join the Beta program`,
                // translator: full sentence is: "Enter your Proton Account details to join the Proton VPN iOS Beta program"
                subTitle: c('Title').t`Enter your ${BRAND_NAME} Account details to join the ${app} Beta program`,
            };
        }
        const continueTo = toAppName ? getContinueToString(toAppName) : '';
        if (authType === AuthType.ExternalSSO) {
            return {
                title: c('sso').t`Sign in to your organization`,
                subTitle: continueTo,
            };
        }
        if (authType === AuthType.AutoSrp) {
            return {
                title: c('sso').t`Welcome`,
                subTitle: (
                    <button
                        onClick={goBack}
                        disabled={!canGoBackToUsername}
                        type="button"
                        className="max-w-full text-ellipsis"
                    >
                        <IcUser /> {username}
                    </button>
                ),
            };
        }
        return {
            title: c('Title').t`Sign in`,
            subTitle: continueTo || c('Info').t`Enter your ${BRAND_NAME} Account details.`,
        };
    })();

    const beforeMain = isPorkbun ? (
        <div className="flex justify-center align-center mb-8">
            <PorkbunHeader />
        </div>
    ) : undefined;

    return (
        <SignInStepLayout title={titles.title} subTitle={titles.subTitle} onBack={handleBack} beforeMain={beforeMain}>
            {testflight === 'vpn' ? (
                <>
                    <Testflight className="mb-8" />
                    <div className="mb-1" />
                </>
            ) : null}
            <LoginForm />
        </SignInStepLayout>
    );
};

/** The credentials step runs as a child of the sign-in machine for the whole page (`state-machine/credentialsStateMachine`). */
export const CredentialsStep = () => {
    const credentialsRef = SignInContext.useSelector((snapshot) => snapshot.children.credentials);
    const { createNotification } = useNotifications();

    // Subscribes before the sign-in starts (children's effects run first), so the notice at page load arrives
    useEffect(() => {
        const subscription = credentialsRef?.on('notice.ssoRequired', () =>
            createNotification({
                type: 'info',
                text: c('Info')
                    .t`Your organization uses single sign-on (SSO). Press Sign in to continue with your SSO provider.`,
            })
        );
        return () => subscription?.unsubscribe();
    }, [credentialsRef]);

    if (!credentialsRef) {
        return null;
    }
    return (
        <CredentialsContext.Provider value={credentialsRef}>
            <CredentialsScreen />
        </CredentialsContext.Provider>
    );
};
