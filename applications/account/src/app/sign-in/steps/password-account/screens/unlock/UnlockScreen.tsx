import { c } from 'ttag';

import UnlockForm from '../../../../../components/password-forms/UnlockForm';
import { SignInStepLayout } from '../../../../components/SignInStepLayout';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectSubmitting } from '../../state-machine/passwordAccountStateMachine';

export const UnlockScreen = () => {
    const actorRef = PasswordAccountContext.useActorRef();
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);
    return (
        <SignInStepLayout
            title={c('Title').t`Unlock your data`}
            onBack={() => actorRef.send({ type: 'decision.back' })}
        >
            <UnlockForm
                submitting={submitting}
                onSubmit={(password) => actorRef.send({ type: 'unlock.submitted', payload: { password } })}
            />
        </SignInStepLayout>
    );
};
