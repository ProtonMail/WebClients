import { SignInStepLayout } from '../../../components/SignInStepLayout';
import { SSOContext } from '../SSOContext';
import SSODeviceRejected from '../components/SSODeviceRejected';

export const RejectedScreen = () => {
    const actorRef = SSOContext.useActorRef();
    const onBack = () => actorRef.send({ type: 'decision.back' });
    return (
        <SignInStepLayout title="" onBack={onBack}>
            <SSODeviceRejected onBack={onBack} />
        </SignInStepLayout>
    );
};
