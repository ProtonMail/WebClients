import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import SSODeviceAdminGranted from '../components/SSODeviceAdminGranted';

export const AdminGrantedScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    return (
        <>
            {/* No title: the confirmation brings its own */}
            <layout.Header onBack={onBack} />
            <layout.Body>
                <SSODeviceAdminGranted onContinue={() => actorRef.send({ type: 'sso.continued' })} />
            </layout.Body>
        </>
    );
};
