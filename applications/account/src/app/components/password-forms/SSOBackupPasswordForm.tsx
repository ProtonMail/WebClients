import { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

interface Props {
    onSubmit: (keyPassword: string) => void;
    submitting: boolean;
    onAskAdminHelp?: () => void;
    /** The field's label, "Backup password" by default. */
    passwordLabel?: string;
    /** Shown between the field and the submit button. */
    hint?: ReactNode;
    /** Why the last password was rejected, shown under the field. */
    error?: string;
    /** The user changed the password. */
    onChange?: () => void;
}

const getBackupPasswordData = () => {
    return {
        formName: 'backupPasswordForm',
        passwordId: 'backupPassword',
        passwordLabel: c('Label').t`Backup password`,
        cta: c('Action').t`Continue`,
    };
};

const SSOBackupPasswordForm = ({
    onSubmit,
    submitting,
    onAskAdminHelp,
    passwordLabel,
    hint,
    error,
    onChange,
}: Props) => {
    const [keyPassword, setKeyPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const data = getBackupPasswordData();

    return (
        <form
            name={data.formName}
            onSubmit={(event) => {
                event.preventDefault();
                if (submitting || !onFormSubmit()) {
                    return;
                }
                onSubmit(keyPassword);
            }}
            method="post"
        >
            <InputFieldTwo
                as={PasswordInputTwo}
                id={data.passwordId}
                bigger
                label={passwordLabel ?? data.passwordLabel}
                error={validator([requiredValidator(keyPassword)]) || error}
                disableChange={submitting}
                autoFocus
                value={keyPassword}
                onValue={(value: string) => {
                    setKeyPassword(value);
                    onChange?.();
                }}
            />
            {hint}
            <div className="mt-6">
                <Button size="large" color="norm" type="submit" fullWidth loading={submitting}>
                    {data.cta}
                </Button>
                {onAskAdminHelp && (
                    <Button size="large" color="norm" shape="ghost" fullWidth onClick={onAskAdminHelp} className="mt-2">
                        {c('sso').t`Ask administrator for help`}
                    </Button>
                )}
            </div>
        </form>
    );
};

export default SSOBackupPasswordForm;
