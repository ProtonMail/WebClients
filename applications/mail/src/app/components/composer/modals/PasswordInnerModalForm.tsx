import { ChangeEvent, useEffect, useState } from 'react';

import { c } from 'ttag';

import {
    Copy,
    FeatureCode,
    Info,
    InputFieldTwo,
    PasswordInputTwo,
    generateUID,
    useFeatures,
    useNotifications,
} from '@proton/components';

import { MessageState } from '../../../logic/messages/messagesTypes';

import './PasswordInnerModal.scss';

interface Props {
    message?: MessageState;
    password: string;
    setPassword: (password: string) => void;
    passwordHint: string;
    setPasswordHint: (hint: string) => void;
    isPasswordSet: boolean;
    setIsPasswordSet: (value: boolean) => void;
    isMatching: boolean;
    setIsMatching: (value: boolean) => void;
    validator: (validations: string[]) => string;
}

const PasswordInnerModalForm = ({
    message,
    password,
    setPassword,
    passwordHint,
    setPasswordHint,
    isPasswordSet,
    setIsPasswordSet,
    isMatching,
    setIsMatching,
    validator,
}: Props) => {
    const [passwordVerif, setPasswordVerif] = useState(message?.data?.Password || '');
    const [uid] = useState(generateUID('password-modal'));
    const { createNotification } = useNotifications();
    const [{ feature: EORedesignFeature, loading }] = useFeatures([FeatureCode.EORedesign]);

    const isEORedesign = EORedesignFeature?.Value;

    useEffect(() => {
        if (password !== '') {
            setIsPasswordSet(true);
        } else if (password === '') {
            setIsPasswordSet(false);
        }
        if (isPasswordSet && password !== passwordVerif) {
            setIsMatching(false);
        } else if (isPasswordSet && password === passwordVerif) {
            setIsMatching(true);
        }
    }, [password, passwordVerif]);

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
        if (isMatching !== undefined && !isMatching && !isEORedesign) {
            return c('Error').t`Passwords do not match`;
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
            defaultType={isEORedesign ? 'text' : 'password'}
            onChange={handleChange(setPassword)}
            error={validator([getErrorText()])}
        />
    );

    if (loading) {
        return null;
    }

    return (
        <>
            {isEORedesign && (
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
            )}

            {!isEORedesign && (
                <>
                    {passwordInput}
                    <InputFieldTwo
                        id={`composer-password-verif-${uid}`}
                        label={c('Label').t`Confirm password`}
                        data-testid="encryption-modal:confirm-password-input"
                        value={passwordVerif}
                        as={PasswordInputTwo}
                        placeholder={c('Placeholder').t`Confirm password`}
                        onChange={handleChange(setPasswordVerif)}
                        autoComplete="off"
                        error={validator([getErrorText(true)])}
                    />
                </>
            )}

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
