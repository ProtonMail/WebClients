import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, Row, Field, Label, PasswordInput, TwoFactorInput, useUserSettings } from 'react-components';

const AskAuthModal = ({ onClose, onSubmit, error, hideTotp, ...rest }) => {
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [{ '2FA': { Enabled } } = {}] = useUserSettings();

    const showTotp = !hideTotp && !!Enabled;

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => onSubmit({ password, totp })}
            title={c('Title').t`Sign in again to continue`}
            close={c('Label').t`Cancel`}
            submit={c('Label').t`Submit`}
            error={error}
            small
            {...rest}
        >
            <Row>
                <Label htmlFor="password">{c('Label').t`Password`}</Label>
                <Field>
                    <PasswordInput
                        placeholder={c('Placeholder').t`Password`}
                        id="password"
                        value={password}
                        onChange={({ target: { value } }) => setPassword(value)}
                        error={error}
                        autoFocus={true}
                        autoComplete="current-password"
                        required
                    />
                </Field>
            </Row>
            {showTotp && (
                <Row>
                    <Label htmlFor="totp">{c('Label').t`Two factor code`}</Label>
                    <Field>
                        <TwoFactorInput
                            placeholder={c('Placeholder').t`Two factor code`}
                            id="totp"
                            value={totp}
                            error={error}
                            onChange={({ target: { value } }) => setTotp(value)}
                            required
                        />
                    </Field>
                </Row>
            )}
        </FormModal>
    );
};

AskAuthModal.propTypes = {
    onClose: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    error: PropTypes.string,
    hideTotp: PropTypes.bool
};

export default AskAuthModal;
