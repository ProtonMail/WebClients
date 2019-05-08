import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { ResetButton, PrimaryButton, Input, TextArea, Label, Row, Field } from 'react-components';

import Modal from './Modal';
import Footer from './Footer';
import Content from './Content';
import { generateUID } from '../../helpers/component';
import { Alert } from '../..';

/*
Good candidates:
- Gift code modal
- Orgnization name modal
- Black/White list modal
- OpenVPN modal
*/

const InputModal = ({
    label,
    type,
    title,
    warning,
    input: initialInput,
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

    let InputField;
    switch (type) {
        case 'textarea':
            InputField = (
                <>
                    {warning ? <Alert type="warning">{warning}</Alert> : null}
                    <TextArea
                        id={id}
                        value={input}
                        placeholder={placeholder}
                        onChange={handleChange}
                        autoFocus={true}
                        readOnly={loading}
                        required
                    />
                </>
            );
            break;
        default:
            InputField = (
                <Row>
                    <Label htmlFor={id}>{label}</Label>
                    <Field>
                        <Input
                            id={id}
                            value={input}
                            placeholder={placeholder}
                            onChange={handleChange}
                            autoFocus={true}
                            readOnly={loading}
                            required
                        />
                    </Field>
                </Row>
            );
    }

    return (
        <Modal onClose={onClose} title={title} type="small">
            <Content onSubmit={handleSubmit} onReset={onClose} loading={loading}>
                {InputField}
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
    type: PropTypes.string.isRequired,
    input: PropTypes.string,
    onClose: PropTypes.func,
    label: PropTypes.string.isRequired,
    onSubmit: PropTypes.func,
    title: PropTypes.string,
    warning: PropTypes.string,
    cancel: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    submit: PropTypes.string,
    loading: PropTypes.bool
};

InputModal.defaultProps = {
    type: 'input',
    input: '',
    label: '',
    warning: '',
    cancel: c('Action').t`Cancel`,
    submit: c('Action').t`Submit`
};

export default InputModal;
