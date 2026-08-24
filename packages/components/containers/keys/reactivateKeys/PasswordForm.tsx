import { useState } from 'react';

import { c } from 'ttag';

import { reactivateKeysByPasswordThunk } from '@proton/account/addressKeys/reactivateKeysActions';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import InputFieldTwo from '../../../components/v2/field/InputField';
import PasswordInputTwo from '../../../components/v2/input/PasswordInput';
import useFormErrors from '../../../components/v2/useFormErrors';
import useErrorHandler from '../../../hooks/useErrorHandler';
import useNotifications from '../../../hooks/useNotifications';
import type { ReactivateKeysContentProps } from './interface';
import { getKeyReactivationNotification } from './reactivateHelper';

export const PasswordFormId = 'password-form';

export const PasswordForm = ({ keyReactivationStates, loading, onLoading, onClose }: ReactivateKeysContentProps) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [password, setPassword] = useState('');
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const handleSubmit = async () => {
        try {
            onLoading(true);

            createNotification(
                getKeyReactivationNotification(
                    await dispatch(reactivateKeysByPasswordThunk({ password, keyReactivationStates }))
                )
            );

            onClose?.();
        } catch (error) {
            handleError(error);
        } finally {
            onLoading(false);
        }
    };

    return (
        <form
            id={PasswordFormId}
            onSubmit={(event) => {
                event.preventDefault();
                if (!onFormSubmit()) {
                    return;
                }
                void handleSubmit();
            }}
        >
            <div className="mb-4">{c('Info').t`This is the password you used before the password reset.`}</div>
            <InputFieldTwo
                id="password"
                label={c('Label').t`Previous password`}
                as={PasswordInputTwo}
                error={validator([requiredValidator(password)])}
                value={password}
                onValue={setPassword}
                autoFocus
                disableChange={loading}
            />
        </form>
    );
};
