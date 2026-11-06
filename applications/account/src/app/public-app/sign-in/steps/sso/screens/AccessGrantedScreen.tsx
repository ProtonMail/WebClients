import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import SSODeviceAccessGranted from '../components/SSODeviceAccessGranted';
import { selectSubmitting } from '../state-machine/ssoStateMachine';

/** After an admin approval, when the organization disabled backup passwords: a confirmation, with its own heading. */
export const AccessGrantedScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    const submitting = SSOContext.useSelector(selectSubmitting);
    return (
        <>
            {/* No title: the confirmation brings its own */}
            <layout.Header onBack={onBack} />
            <layout.Body>
                <SSODeviceAccessGranted
                    submitting={submitting}
                    onContinue={() =>
                        actorRef.send({ type: 'sso.newBackupPassword.submitted', payload: { password: null } })
                    }
                />
            </layout.Body>
        </>
    );
};
