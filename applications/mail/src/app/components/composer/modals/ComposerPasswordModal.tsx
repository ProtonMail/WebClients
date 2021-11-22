import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { useState, ChangeEvent, useEffect } from 'react';
import { c } from 'ttag';
import {
    Href,
    generateUID,
    useNotifications,
    InputFieldTwo,
    PasswordInputTwo,
    useFormErrors,
} from '@proton/components';
import { clearBit, setBit } from '@proton/shared/lib/helpers/bitset';

import ComposerInnerModal from './ComposerInnerModal';
import { MessageChange } from '../Composer';

interface Props {
    message?: Message;
    onClose: () => void;
    onChange: MessageChange;
}

const ComposerPasswordModal = ({ message, onClose, onChange }: Props) => {
    const [uid] = useState(generateUID('password-modal'));
    const [password, setPassword] = useState(message?.Password || '');
    const [passwordVerif, setPasswordVerif] = useState(message?.Password || '');
    const [passwordHint, setPasswordHint] = useState(message?.PasswordHint || '');
    const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false);
    const [isMatching, setIsMatching] = useState<boolean>(false);
    const { createNotification } = useNotifications();

    const { validator, onFormSubmit } = useFormErrors();

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

    const handleSubmit = () => {
        onFormSubmit();

        if (!isPasswordSet || !isMatching) {
            return;
        }

        onChange(
            (message) => ({
                data: {
                    Flags: setBit(message.data?.Flags, MESSAGE_FLAGS.FLAG_INTERNAL),
                    Password: password,
                    PasswordHint: passwordHint,
                },
            }),
            true
        );

        createNotification({ text: c('Notification').t`Password has been set successfully` });

        onClose();
    };

    const handleCancel = () => {
        onChange(
            (message) => ({
                data: {
                    Flags: clearBit(message.data?.Flags, MESSAGE_FLAGS.FLAG_INTERNAL),
                    Password: undefined,
                    PasswordHint: undefined,
                },
            }),
            true
        );
        onClose();
    };

    const getErrorText = (isConfirmInput = false) => {
        if (isPasswordSet !== undefined && !isPasswordSet) {
            if (isConfirmInput) {
                return c('Error').t`Please repeat the password`;
            }
            return c('Error').t`Please set a password`;
        }
        if (isMatching !== undefined && !isMatching) {
            return c('Error').t`Passwords do not match`;
        }
        return '';
    };

    return (
        <ComposerInnerModal
            title={c('Info').t`Encrypt for non-ProtonMail users`}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
        >
            <p className="mt0 mb1 color-weak">
                {c('Info')
                    .t`Encrypted messages to non-ProtonMail recipients will expire in 28 days unless a shorter expiration time is set.`}
                <br />
                <Href url="https://protonmail.com/support/knowledge-base/encrypt-for-outside-users/">
                    {c('Info').t`Learn more`}
                </Href>
            </p>

            <InputFieldTwo
                id={`composer-password-${uid}`}
                label={c('Label').t`Message password`}
                data-testid="encryption-modal:password-input"
                value={password}
                as={PasswordInputTwo}
                placeholder={c('Placeholder').t`Password`}
                onChange={handleChange(setPassword)}
                error={validator([getErrorText()])}
            />
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
        </ComposerInnerModal>
    );
};

export default ComposerPasswordModal;
