import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';
import { Input, Label, Button } from 'react-components';

const UnlockForm = ({ onSubmit, loading }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!password) {
            return;
        }
        onSubmit({ password });
    };

    const onChange = (set) => ({ target }) => set(target.value);

    return (
        <form name="unlockForm" noValidate onSubmit={handleSubmit}>
            <div>
                <Label htmlFor="password">{t`Mailbox password`}</Label>
                <Input
                    type="text"
                    name="password"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="password"
                    required
                    value={password}
                    placeholder={t`Mailbox password`}
                    onChange={onChange(setPassword)}
                />
            </div>
            <div>
                <Button type="submit" disabled={loading}>
                    Submit
                </Button>
            </div>
        </form>
    );
};

UnlockForm.propTypes = {
    loading: PropTypes.bool,
    onSubmit: PropTypes.func
};

export default UnlockForm;
