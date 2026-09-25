import { shallowEqual } from '@xstate/react';

import { SignInStepLayout } from '../../../components/SignInStepLayout';
import { SSOContext } from '../SSOContext';
import SSOFirstLoginAfterConversion from '../components/SSOFirstLoginAfterConversion';
import { selectJoinOrganization } from '../state-machine/ssoStateMachine';

export const FirstLoginAfterConversionScreen = () => {
    const actorRef = SSOContext.useActorRef();
    const organization = SSOContext.useSelector(selectJoinOrganization, shallowEqual);
    return (
        <SignInStepLayout title="" onBack={() => actorRef.send({ type: 'decision.back' })}>
            <SSOFirstLoginAfterConversion
                organization={organization}
                onContinue={() => actorRef.send({ type: 'sso.continued' })}
            />
        </SignInStepLayout>
    );
};
