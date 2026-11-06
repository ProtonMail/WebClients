import { c } from 'ttag';

import UnlockForm from '../../../../../components/password-forms/UnlockForm';
import type { SignInScreen, SignInScreenProps } from '../../../../routes/signInRoute';
import { useSignInProps } from '../../../../wizard/SignInProvider';
import { PasswordAccountContext } from '../../PasswordAccountContext';
import { selectSubmitting, selectUnlockError } from '../../state-machine/passwordAccountStateMachine';

export const UnlockScreen: SignInScreen = ({ onBack }: SignInScreenProps) => {
    const { layout } = useSignInProps();
    const actorRef = PasswordAccountContext.useActorRef();
    const submitting = PasswordAccountContext.useSelector(selectSubmitting);
    const unlockError = PasswordAccountContext.useSelector(selectUnlockError);
    return (
        <>
            <layout.Header title={c('Title').t`Unlock your data`} onBack={onBack} />
            <layout.Body>
                <UnlockForm
                    submitting={submitting}
                    error={unlockError}
                    onChange={() => actorRef.send({ type: 'unlock.passwordEdited' })}
                    onSubmit={(password) => actorRef.send({ type: 'unlock.submitted', payload: { password } })}
                />
            </layout.Body>
        </>
    );
};
