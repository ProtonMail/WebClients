import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Copy, Info, InputFieldTwo, PasswordInputTwo, useNotifications } from '@proton/components';
import { minLengthValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import generateUID from '@proton/utils/generateUID';

import './PasswordInnerModal.scss';

const MIN_PASSWORD_LENGTH = 8;

interface Props {
    password: string;
    setPassword: (password: string) => void;
    passwordHint: string;
    setPasswordHint: (hint: string) => void;
    validator: (validations: string[]) => string;
}

const PasswordInnerModalForm = ({ password, setPassword, passwordHint, setPasswordHint, validator }: Props) => {
    const [uid] = useState(generateUID('password-modal'));
    const { createNotification } = useNotifications();

    const handleChange = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
        setter(event.target.value);
    };

    const passwordLabel = (
        <div>
            <span className="mr-1">{c('Label').t`Password`}</span>
            <Info className="mb-1" title={c('Info').t`Don't forget to share the password with the recipient`} />
        </div>
    );

    const passwordInput = (
        <InputFieldTwo
            id={`composer-password-${uid}`}
            label={passwordLabel}
            data-testid="encryption-modal:password-input"
            value={password}
            as={PasswordInputTwo}
            placeholder={c('Placeholder').t`Password`}
            defaultType="text"
            onChange={handleChange(setPassword)}
            error={validator([requiredValidator(password), minLengthValidator(password, MIN_PASSWORD_LENGTH)])}
        />
    );
    return (
        <>
            <div className="flex flex-nowrap">
                <span className="mr-2 w-full">{passwordInput}</span>
                <span className="shrink-0 password-inner-modal-copy-container">
                    <Copy
                        value={password}
                        className=" password-inner-modal-copy"
                        tooltipText={c('Action').t`Copy password to clipboard`}
                        size="medium"
                        onCopy={() => {
                            createNotification({ text: c('Success').t`Password copied to clipboard` });
                        }}
                    />
                </span>
            </div>

            <InputFieldTwo
                id={`composer-password-hint-${uid}`}
                label={c('Label').t`Password hint`}
                hint={c('info').t`Optional`}
                data-testid="encryption-modal:password-hint"
                value={passwordHint}
                placeholder={c('Placeholder').t`Hint`}
                onChange={handleChange(setPasswordHint)}
                autoComplete="off"
            />
        </>
    );
};

export default PasswordInnerModalForm;
