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
- Black/White list modal
- OpenVPN modal
*/

const InputModal = ({
    label,
    title,
    input: initialInput,
    show,
    onClose,
    onSubmit,
    cancel,
    submit,
    placeholder,
    loading
}) => {
    const [input, set] = useState(initialInput);
    const id = generateUID('input-modal');
    const handleChange = ({ target }) => set(target.value);
    const handleSubmit = () => onSubmit(input);

    return (
        <Modal show={show} onClose={onClose} title={title} type="small">
            <Content onSubmit={handleSubmit} onReset={onClose} loading={loading}>
                <Row>
                    <Label htmlFor={id}>{label}</Label>
                    <Input
                        id={id}
                        value={input}
                        placeholder={placeholder}
                        onChange={handleChange}
                        autoFocus={true}
                        readOnly={loading}
                        required
                    />
                </Row>
                <Footer>
                    <ResetButton disabled={loading}>{cancel}</ResetButton>
                    <PrimaryButton type="submit" disabled={loading}>
                        {submit}
                    </PrimaryButton>
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
    show: PropTypes.bool.isRequired,
    placeholder: PropTypes.string,
    submit: PropTypes.string,
    loading: PropTypes.bool
};

InputModal.defaultProps = {
    show: false,
    input: '',
    label: '',
    cancel: c('Action').t`Cancel`,
    submit: c('Action').t`Submit`
};

export default InputModal;
