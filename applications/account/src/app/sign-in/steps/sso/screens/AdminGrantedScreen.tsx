import { SignInStepLayout } from '../../../components/SignInStepLayout';
import { SSOContext } from '../SSOContext';
import SSODeviceAdminGranted from '../components/SSODeviceAdminGranted';

export const AdminGrantedScreen = () => {
    const actorRef = SSOContext.useActorRef();
    return (
        <SignInStepLayout title="" onBack={() => actorRef.send({ type: 'decision.back' })}>
            <SSODeviceAdminGranted onContinue={() => actorRef.send({ type: 'sso.continued' })} />
        </SignInStepLayout>
    );
};
