import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Modal,
    ContentModal,
    Row,
    Label,
    PasswordInput,
    FooterModal,
    ResetButton,
    PrimaryButton
} from 'react-components';
import { generateUID } from '../../helpers/component';

const AskPasswordModal = ({ onClose, onSubmit }) => {
    const [input, set] = useState('');
    const id = generateUID('password-modal');
    const handleChange = ({ target }) => set(target.value);
    const handleSubmit = () => onSubmit(input);
    return (
        <Modal show={true} onClose={onClose} title={c('Title').t`Sign in again to continue`} type="small">
            <ContentModal onSubmit={handleSubmit} onReset={onClose}>
                <Row>
                    <Label htmlFor={id}>{c('Label').t`Password`}</Label>
                    <PasswordInput id={id} value={input} onChange={handleChange} autoFocus={true} required />
                </Row>
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
    onSubmit: PropTypes.func.isRequired
};
export default AskPasswordModal;
