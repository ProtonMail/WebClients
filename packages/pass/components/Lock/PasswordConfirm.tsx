import { type FC } from 'react';

import { c } from 'ttag';

import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { type PasswordVerification } from '@proton/pass/lib/auth/password';
import { validateCurrentPassword } from '@proton/pass/lib/validation/auth';
import { passwordConfirm } from '@proton/pass/store/actions';

import { PasswordForm } from './PasswordForm';

type Props = { mode?: PasswordVerification; onSuccess: () => void };

export const PasswordConfirm: FC<Props> = ({ mode, onSuccess }) => {
    const confirm = useRequest(passwordConfirm, { initial: true, onSuccess });

    return (
        <PasswordForm
            id="password-confirm"
            loading={confirm.loading}
            submitLabel={c('Action').t`Continue`}
            onSubmit={({ password }) => confirm.dispatch({ password, mode })}
            onValidate={validateCurrentPassword}
        />
    );
};
