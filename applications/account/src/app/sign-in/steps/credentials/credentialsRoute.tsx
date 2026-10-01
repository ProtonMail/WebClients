import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';

import TroubleshootWithLumo from '../../../public/TroubleshootWithLumo';
import PorkbunHeader from '../../../single-signup-v2/mail/PorkbunHeader';
import { AuthType } from '../../auth/interface';
import { signInRoute } from '../../routes/signInRoute';
import { useSignInProps } from '../../wizard/SignInProvider';
import { CredentialsContext } from './CredentialsContext';
import { LoginChallengeProvider } from './LoginChallengeContext';
import { AutoPasswordScreen } from './screens/AutoPasswordScreen';
import { AutoScreen } from './screens/AutoScreen';
import { PasswordScreen } from './screens/PasswordScreen';
import { SSOScreen } from './screens/SSOScreen';
import { selectAuthType, selectCanNavigateBack } from './state-machine/credentialsStateMachine';
import { useLoginChallenge } from './useLoginChallenge';

/**
 * What's kept around the credentials screens while they switch: the notice of an organization that uses SSO, the
 * anti-abuse challenge, which keeps its data (each screen takes its result on submit and sends it with the
 * credentials). The testflight banner is at the top of each screen's body.
 */
const CredentialsFrame = ({ children }: { children: ReactNode }) => {
    const actorRef = CredentialsContext.useActorRef();
    const { createNotification } = useNotifications();
    const challenge = useLoginChallenge();

    // Subscribes before the sign-in starts (children's effects run first), so the notice at page load arrives
    useEffect(() => {
        const subscription = actorRef.on('notice.ssoRequired', () =>
            createNotification({
                type: 'info',
                text: c('Info')
                    .t`Your organization uses single sign-on (SSO). Press Sign in to continue with your SSO provider.`,
            })
        );
        return () => subscription.unsubscribe();
    }, [actorRef]);

    return (
        <LoginChallengeProvider usernameRef={challenge.usernameRef} getPayload={challenge.getPayload}>
            {challenge.element}
            {children}
        </LoginChallengeProvider>
    );
};

const PorkbunBeforeMain = () => {
    const { isPorkbun } = useSignInProps();
    return isPorkbun ? (
        <div className="flex justify-center align-center mb-8">
            <PorkbunHeader />
        </div>
    ) : null;
};

/**
 * The credentials step runs as a child of the sign-in machine for the whole page (`state-machine/credentialsStateMachine`).
 * Each screen owns its fields and validation, so switching modes starts fresh; the machine carries the username over.
 */
export const credentialsRoute = signInRoute({
    provider: CredentialsContext.Provider,
    Frame: CredentialsFrame,
    BeforeMain: PorkbunBeforeMain,
    BottomRight: TroubleshootWithLumo,
    decorated: true,
    // Back leaves the page, which only works when it has somewhere to go back to
    offersBack: selectCanNavigateBack,
    screen: selectAuthType,
    screens: {
        [AuthType.Auto]: AutoScreen,
        [AuthType.AutoSrp]: AutoPasswordScreen,
        [AuthType.Srp]: PasswordScreen,
        [AuthType.ExternalSSO]: SSOScreen,
    },
});
