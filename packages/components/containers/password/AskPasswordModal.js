import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, Row, Field, Label, PasswordInput, TwoFactorInput, useUserSettings } from 'react-components';

const AskPasswordModal = ({ onClose, onSubmit, hideTwoFactor, ...rest }) => {
    const [model, set] = useState({
        password: '',
        totp: ''
    });

    const handleChange = (key) => ({ target }) => set({ ...model, [key]: target.value });

    const handleSubmit = () => {
        onSubmit(model);
        onClose();
    };

    const [{ TwoFactor } = {}] = useUserSettings();

    return (
        <FormModal
            onClose={onClose}
            onSubmit={handleSubmit}
            title={c('Title').t`Sign in again to continue`}
            close={c('Label').t`Cancel`}
            submit={c('Label').t`Submit`}
            small
            {...rest}
        >
            <Row>
                <Label htmlFor="password">{c('Label').t`Password`}</Label>
                <Field>
                    <PasswordInput
                        id="password"
                        value={model.password}
                        onChange={handleChange('password')}
                        autoFocus={true}
                        required
                    />
                </Field>
            </Row>
            {hideTwoFactor ? null : TwoFactor ? (
                <Row>
                    <Label htmlFor="totp">{c('Label').t`Two factor code`}</Label>
                    <Field>
                        <TwoFactorInput id="totp" value={model.totp} onChange={handleChange('totp')} required />
                    </Field>
                </Row>
            ) : null}
        </FormModal>
    );
};

AskPasswordModal.propTypes = {
    onClose: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    hideTwoFactor: PropTypes.bool
};

AskPasswordModal.defaultProps = {
    hideTwoFactor: false
};

export default AskPasswordModal;
