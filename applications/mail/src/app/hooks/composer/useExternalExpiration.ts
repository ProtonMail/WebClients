import { useState } from 'react';

import { useFormErrors } from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';

export const useExternalExpiration = (message?: MessageState) => {
    const [password, setPassword] = useState(message?.data?.Password || '');
    const [passwordHint, setPasswordHint] = useState(message?.data?.PasswordHint || '');

    const { validator, onFormSubmit } = useFormErrors();

    return {
        password,
        setPassword,
        passwordHint,
        setPasswordHint,
        validator,
        onFormSubmit,
    };
};
