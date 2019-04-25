import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Modal,
    ContentModal,
    Row,
    Field,
    Label,
    PasswordInput,
    TwoFactorInput,
    FooterModal,
    ResetButton,
    PrimaryButton,
    useUserSettings
} from 'react-components';

const AskPasswordModal = ({ onClose, onSubmit, hideTwoFactor }) => {
    const [model, set] = useState({
        password: '',
        totp: ''
    });
    const handleChange = (key) => ({ target }) => set({ ...model, [key]: target.value });
    const handleSubmit = () => onSubmit(model);
    const [{ TwoFactor } = {}, loading] = useUserSettings();
    return (
        <Modal show={true} onClose={onClose} title={c('Title').t`Sign in again to continue`} type="small">
            <ContentModal loading={loading} onSubmit={handleSubmit} onReset={onClose}>
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
                <FooterModal>
                    <ResetButton>{c('Label').t`Cancel`}</ResetButton>
                    <PrimaryButton type="submit">{c('Label').t`Submit`}</PrimaryButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

AskPasswordModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    hideTwoFactor: PropTypes.bool
};

AskPasswordModal.defaultProps = {
    hideTwoFactor: false
};

export default AskPasswordModal;
