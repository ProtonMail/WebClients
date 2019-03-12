import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { ResetButton, PrimaryButton, Input, Label, Row } from 'react-components';

import Modal from './Modal';
import Footer from './Footer';
import Content from './Content';
import { generateUID } from '../../helpers/component';

/*
Good candidates:
- Gift code modal
- Orgnization name modal
- Password modal to unlock scope
- Black/White list modal
- OpenVPN modal
*/

const InputModal = ({ label, title, input: initialInput, show, onClose, onSubmit, cancel, submit, placeholder }) => {
    const [input, set] = useState(initialInput);
    const id = generateUID('input-modal');
    const handleChange = (event) => set(event.target.value);
    const handleSubmit = () => onSubmit(input);

    return (
        <Modal show={show} onClose={onClose} title={title} modalClassName="pm-modal--smaller">
            <Content onSubmit={handleSubmit} onReset={onClose}>
                <Row>
                    <Label htmlFor={id}>{label}</Label>
                    <Input
                        id={id}
                        value={input}
                        placeholder={placeholder}
                        onChange={handleChange}
                        autoFocus={true}
                        required
                    />
                </Row>
                <Footer>
                    <ResetButton>{cancel}</ResetButton>
                    <PrimaryButton type="submit">{submit}</PrimaryButton>
                </Footer>
            </Content>
        </Modal>
    );
};

InputModal.propTypes = {
    input: PropTypes.string,
    onClose: PropTypes.func,
    label: PropTypes.string.isRequired,
    onSubmit: PropTypes.func,
    title: PropTypes.string,
    cancel: PropTypes.string.isRequired,
    confirm: PropTypes.string.isRequired,
    show: PropTypes.bool.isRequired,
    placeholder: PropTypes.string,
    submit: PropTypes.string
};

InputModal.defaultProps = {
    show: false,
    input: '',
    label: '',
    cancel: c('Action').t`Cancel`,
    submit: c('Action').t`Submit`
};

export default InputModal;
