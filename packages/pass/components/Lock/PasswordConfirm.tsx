import type { FC } from 'react';

import { c } from 'ttag';

import { useRequest } from '../../hooks/useRequest';
import type { PasswordVerification } from '../../lib/auth/password';
import { validateCurrentPassword } from '../../lib/validation/auth';
import { passwordConfirm } from '../../store/actions';
import { useOnline } from '../Core/ConnectivityProvider';
import { PasswordForm } from './PasswordForm';

type Props = { mode?: PasswordVerification; onSuccess: () => void };

export const PasswordConfirm: FC<Props> = ({ mode, onSuccess }) => {
    const online = useOnline();
    const confirm = useRequest(passwordConfirm, { initial: true, onSuccess });

    return (
        <PasswordForm
            autosavable
            disabled={!online}
            id="password-confirm"
            loading={confirm.loading}
            submitLabel={c('Action').t`Continue`}
            onSubmit={(password) => confirm.dispatch({ password, mode })}
            onValidate={validateCurrentPassword}
        />
    );
};
