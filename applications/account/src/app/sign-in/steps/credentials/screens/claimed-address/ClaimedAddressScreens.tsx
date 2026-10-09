import { c } from 'ttag';

import useLoading from '@proton/hooks/useLoading';

import { UserNameWithIcon } from '../../../../../components/username/UserNameWithIcon';
import type { SignInScreen, SignInScreenProps } from '../../../../routes/signInRoute';
import { useSignInProps } from '../../../../wizard/SignInProvider';
import { CredentialsContext } from '../../CredentialsContext';
import { useLoginChallengeContext } from '../../LoginChallengeContext';
import { CancelSSOButton } from '../../fields/CancelSSOButton';
import {
    selectAwaitingProvider,
    selectErrorMessage,
    selectSubmitting,
    selectUsername,
} from '../../state-machine/credentialsStateMachine';
import ClaimedAddressPasswordForm from './ClaimedAddressPasswordForm';
import ClaimedAddressSSOChoiceForm from './ClaimedAddressSSOChoiceForm';

/*
 * Recovering an address an organization claimed (the credentials machine's `claimedAddress`): the choice between the
 * organization's identity provider and recovery, and proving ownership with the password of the account the address
 * belonged to. Both show the address the user typed under their title (the candidate IDs behind it are opaque), and
 * back returns to the form the recovery was reached from.
 */

/** The identity provider, or the personal account the address used to belong to. */
export const ClaimedAddressChoiceScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const email = CredentialsContext.useSelector(selectUsername);
    // Loading while the provider window opens, and after it signed in
    const submitting = CredentialsContext.useSelector(selectSubmitting);
    const awaitingProvider = CredentialsContext.useSelector(selectAwaitingProvider);

    return (
        <>
            <layout.Header
                title={c('claimed address').t`Sign in with your organization?`}
                subTitle={<UserNameWithIcon username={email} />}
                onBack={onBack}
            />
            <layout.Body>
                <ClaimedAddressSSOChoiceForm
                    loading={submitting}
                    onContinueWithSSO={() => actorRef.send({ type: 'claimed.ssoRequested' })}
                    onRecover={() => actorRef.send({ type: 'claimed.recoveryChosen' })}
                />
                {awaitingProvider && (
                    <CancelSSOButton onClick={() => actorRef.send({ type: 'externalSSO.cancelled' })} />
                )}
            </layout.Body>
        </>
    );
};

ClaimedAddressChoiceScreen.offersBack = true;

/** Proving ownership with the password of the account the address belonged to. */
export const ClaimedAddressVerifyScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = CredentialsContext.useActorRef();
    const email = CredentialsContext.useSelector(selectUsername);
    const errorMessage = CredentialsContext.useSelector(selectErrorMessage);
    const submitting = CredentialsContext.useSelector(selectSubmitting);
    const { getPayload } = useLoginChallengeContext();
    // Covers the wait for the challenge result, before the machine takes over
    const [collecting, withCollecting] = useLoading();

    const handleSubmit = async (password: string) => {
        const payload = await getPayload();
        actorRef.send({ type: 'claimed.submitted', payload: { password, payload } });
    };

    return (
        <>
            <layout.Header
                title={c('claimed address').t`Verify it's you`}
                subTitle={<UserNameWithIcon username={email} />}
                onBack={onBack}
            />
            <layout.Body>
                <ClaimedAddressPasswordForm
                    email={email}
                    loading={submitting || collecting}
                    error={errorMessage}
                    onChangePassword={() => actorRef.send({ type: 'credentials.edited' })}
                    onSubmit={(password) => {
                        void withCollecting(handleSubmit(password));
                    }}
                />
            </layout.Body>
        </>
    );
};

ClaimedAddressVerifyScreen.offersBack = true;
