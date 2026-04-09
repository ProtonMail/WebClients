import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import MnemonicInputField, {
    useMnemonicInputValidation,
} from '@proton/components/containers/mnemonic/MnemonicInputField';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useLocalState from '@proton/components/hooks/useLocalState';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import useLoading from '@proton/hooks/useLoading';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import isTruthy from '@proton/utils/isTruthy';

import { UserNameWithIcon } from '../../../components/username/UserNameWithIcon';
import Content from '../../../public/Content';
import Header from '../../../public/Header';
import { defaultPersistentKey } from '../../../public/helper';
import { authMnemonicAndGetKeys } from '../../actions';
import type { UnauthedForgotPasswordStateMachine } from '../../state-machine/UnauthedForgotPasswordStateMachine';
import { useMachineWizard } from '../../wizard/MachineWizardProvider';

export const EnterMnemonicPhrase = () => {
    const { send, snapshot } = useMachineWizard<typeof UnauthedForgotPasswordStateMachine>();
    const { username } = snapshot.context;

    const [mnemonic, setMnemonic] = useState('');
    const mnemonicValidation = useMnemonicInputValidation(mnemonic);
    const { validator, onFormSubmit } = useFormErrors();

    const silentApi = useSilentApi();
    const [loading, withLoading] = useLoading();
    const [persistent] = useLocalState(false, defaultPersistentKey);
    const errorHandler = useErrorHandler();
    const hasInvalidMnemonic = mnemonic && mnemonicValidation.filter(isTruthy);

    const handleSubmit = async () => {
        try {
            const mnemonicData = await authMnemonicAndGetKeys({ username, mnemonic, persistent, api: silentApi });
            if (mnemonicData) {
                send({
                    type: 'mnemonic.validated',
                    payload: {
                        mnemonicData,
                    },
                });
            }
        } catch (e) {
            errorHandler(e);
        }
    };

    return (
        <>
            <Header
                title={c('Title').t`Verify it’s you`}
                subTitle={<UserNameWithIcon username={username} />}
                onBack={() => send({ type: 'decision.back' })}
            />
            <Content>
                <p>
                    {c('Info')
                        .t`To help keep your account safe, we want to make sure it’s really you trying to sign in.`}
                </p>

                <p>{c('Info').t`Enter the 12-word recovery phrase associated with your account.`}</p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (loading || !onFormSubmit()) {
                            return;
                        }
                        void withLoading(handleSubmit());
                    }}
                >
                    <MnemonicInputField
                        disableChange={loading}
                        value={mnemonic}
                        onValue={setMnemonic}
                        autoFocus
                        error={validator([requiredValidator(mnemonic), ...mnemonicValidation])}
                    />

                    <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                        {c('Action').t`Reset password`}
                    </Button>

                    <Button size="large" fullWidth className="mt-2" onClick={() => send({ type: 'decision.skip' })}>
                        {hasInvalidMnemonic.length > 0
                            ? c('Action').t`Try another way`
                            : c('Action').t`I don't have my phrase`}
                    </Button>
                </form>
            </Content>
        </>
    );
};
