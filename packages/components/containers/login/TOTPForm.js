import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Input, Label, Button } from 'react-components';

const TOTPForm = ({ onSubmit, loading }) => {
    const [totp, setTotp] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!totp) {
            return;
        }
        onSubmit({ totp });
    };

    // Reset local state when loading has finished
    useEffect(() => {
        if (!loading) {
            setTotp('');
        }
    }, [loading]);

    const onChange = (set) => ({ target }) => set(target.value);

    return (
        <form name="twoFaForm" noValidate onSubmit={handleSubmit}>
            <div>
                <Label htmlFor="twoFa">{c('Label').t`Two-factor code`}</Label>
                <Input
                    type="text"
                    name="twoFa"
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    id="twoFa"
                    required
                    value={totp}
                    placeholder={c('Placeholder').t`Two-factor code`}
                    onChange={onChange(setTotp)}
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

TOTPForm.propTypes = {
    loading: PropTypes.bool,
    onSubmit: PropTypes.func
};

export default TOTPForm;
