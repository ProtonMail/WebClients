import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, PasswordInputTwo, useFormErrors } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import Text from '../../public/Text';

interface Props {
    onSubmit: (keyPassword: string) => Promise<void>;
    onAskAdminHelp?: () => void;
}

const getBackupPasswordData = () => {
    return {
        formName: 'backupPasswordForm',
        passwordId: 'backupPassword',
        passwordLabel: c('Label').t`Backup password`,
        cta: c('Action').t`Continue`,
    };
};

const SSOBackupPasswordForm = ({ onSubmit, onAskAdminHelp }: Props) => {
    const [loading, withLoading] = useLoading();
    const [keyPassword, setKeyPassword] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    const data = getBackupPasswordData();

    return (
        <>
            <Text>{c('sso')
                .t`To make sure it's really you trying to sign-in, please enter your backup password.`}</Text>
            <form
                name={data.formName}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (loading || !onFormSubmit()) {
                        return;
                    }
                    withLoading(onSubmit(keyPassword)).catch(noop);
                }}
                method="post"
            >
                <InputFieldTwo
                    as={PasswordInputTwo}
                    id={data.passwordId}
                    bigger
                    label={data.passwordLabel}
                    error={validator([requiredValidator(keyPassword)])}
                    disableChange={loading}
                    autoFocus
                    value={keyPassword}
                    onValue={setKeyPassword}
                />
                <div className="mt-6">
                    <Button size="large" color="norm" type="submit" fullWidth loading={loading}>
                        {data.cta}
                    </Button>
                    <Button size="large" color="norm" shape="ghost" fullWidth onClick={onAskAdminHelp} className="mt-2">
                        {c('sso').t`Ask administrator for help`}
                    </Button>
                </div>
            </form>
        </>
    );
};

export default SSOBackupPasswordForm;
