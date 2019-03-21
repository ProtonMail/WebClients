import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { Button, InputModal, useModal, useUserSettings } from 'react-components';

const RecoveryEmailButton = () => {
    const [{ Email }] = useUserSettings();
    const [email, setEmail] = useState(Email.Value);
    const { isOpen, open, close } = useModal();

    useEffect(() => {
        // TODO call API
    }, [email]);

    return (
        <>
            <Button onClick={open}>{c('Action').t`Edit`}</Button>
            <InputModal
                input={email}
                title={c('Title').t`Update reset/notification email`}
                label={c('Label').t`Email`}
                placeholder="name@domain.com"
                show={isOpen}
                onSubmit={setEmail}
                onClose={close}
            />
        </>
    );
};

export default RecoveryEmailButton;
