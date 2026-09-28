import { c } from 'ttag';

import UnlockForm from '../../../../../components/password-forms/UnlockForm';
import { SignInStepLayout } from '../../../../components/SignInStepLayout';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectSubmitting, selectUnlockError } from '../../state-machine/passwordAccountStateMachine';

export const UnlockScreen = () => {
    const actorRef = PasswordAccountContext.useActorRef();
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);
    const unlockError = PasswordAccountContext.useSelector(selectUnlockError);
    return (
        <SignInStepLayout
            title={c('Title').t`Unlock your data`}
            onBack={() => actorRef.send({ type: 'decision.back' })}
        >
            <UnlockForm
                submitting={submitting}
                error={unlockError}
                onChange={() => actorRef.send({ type: 'unlock.passwordEdited' })}
                onSubmit={(password) => actorRef.send({ type: 'unlock.submitted', payload: { password } })}
            />
        </SignInStepLayout>
    );
};
