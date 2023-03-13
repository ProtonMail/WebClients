import { ChangeEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Copy, Info, InputFieldTwo, PasswordInputTwo, generateUID, useNotifications } from '@proton/components';

import './PasswordInnerModal.scss';

interface Props {
    password: string;
    setPassword: (password: string) => void;
    passwordHint: string;
    setPasswordHint: (hint: string) => void;
    isPasswordSet: boolean;
    setIsPasswordSet: (value: boolean) => void;
    validator: (validations: string[]) => string;
}

const PasswordInnerModalForm = ({
    password,
    setPassword,
    passwordHint,
    setPasswordHint,
    isPasswordSet,
    setIsPasswordSet,
    validator,
}: Props) => {
    const [uid] = useState(generateUID('password-modal'));
    const { createNotification } = useNotifications();

    useEffect(() => {
        if (password !== '') {
            setIsPasswordSet(true);
        } else if (password === '') {
            setIsPasswordSet(false);
        }
    }, [password]);

    const handleChange = (setter: (value: string) => void) => (event: ChangeEvent<HTMLInputElement>) => {
        setter(event.target.value);
    };

    const getErrorText = (isConfirmInput = false) => {
        if (isPasswordSet !== undefined && !isPasswordSet) {
            if (isConfirmInput) {
                return c('Error').t`Please repeat the password`;
            }
            return c('Error').t`Please set a password`;
        }
        return '';
    };

    const passwordLabel = (
        <div>
            <span className="mr0-25">{c('Label').t`Password`}</span>
            <Info className="mb0-25" title={c('Info').t`Don't forget to share the password with the recipient`} />
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
            error={validator([getErrorText()])}
        />
    );
    return (
        <>
            <div className="flex flex-nowrap">
                <span className="mr0-5 w100">{passwordInput}</span>
                <span className="flex-item-noshrink password-inner-modal-copy-container">
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
