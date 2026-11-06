import { shallowEqual } from '@xstate/react';

import type { SignInScreen, SignInScreenProps } from '../../../routes/signInRoute';
import { useSignInProps } from '../../../wizard/SignInProvider';
import { SSOContext } from '../SSOContext';
import SSOFirstLoginAfterConversion from '../components/SSOFirstLoginAfterConversion';
import { selectJoinOrganization } from '../state-machine/ssoStateMachine';

export const FirstLoginAfterConversionScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = SSOContext.useActorRef();
    const organization = SSOContext.useSelector(selectJoinOrganization, shallowEqual);
    return (
        <>
            {/* No title: the welcome brings its own */}
            <layout.Header onBack={onBack} />
            <layout.Body>
                <SSOFirstLoginAfterConversion
                    organization={organization}
                    onContinue={() => actorRef.send({ type: 'sso.continued' })}
                />
            </layout.Body>
        </>
    );
};
