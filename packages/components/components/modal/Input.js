import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { FormModal, Input, TextArea, Label, Row, Field } from 'react-components';

import { generateUID } from '../../helpers/component';

const InputField = ({ type, id, input, placeholder, onChange }) => {
    if (type === 'textarea') {
        return (
            <TextArea id={id} value={input} placeholder={placeholder} onChange={onChange} autoFocus={true} required />
        );
    }

    return <Input id={id} value={input} placeholder={placeholder} onChange={onChange} autoFocus={true} required />;
};

InputField.propTypes = {
    type: PropTypes.string,
    id: PropTypes.string,
    input: PropTypes.string,
    placeholder: PropTypes.string,
    onChange: PropTypes.func
};

const InputModal = ({
    label,
    type,
    title,
    input: initialInput,
    onClose,
    onSubmit,
    cancel,
    submit,
    placeholder,
    ...rest
}) => {
    const [input, set] = useState(initialInput);
    const id = generateUID('input-modal');

    const handleChange = ({ target }) => set(target.value);
    const handleSubmit = () => onSubmit(input);

    return (
        <FormModal
            onClose={onClose}
            onSubmit={handleSubmit}
            close={cancel}
            submit={submit}
            title={title}
            small
            {...rest}
        >
            <Row>
                <Label htmlFor={id}>{label}</Label>
                <Field>
                    <InputField type={type} id={id} value={input} placeholder={placeholder} onChange={handleChange} />
                </Field>
            </Row>
        </FormModal>
    );
};

InputModal.propTypes = {
    type: PropTypes.string.isRequired,
    input: PropTypes.string,
    onClose: PropTypes.func,
    label: PropTypes.string.isRequired,
    onSubmit: PropTypes.func,
    title: PropTypes.string.isRequired,
    cancel: PropTypes.string,
    placeholder: PropTypes.string,
    submit: PropTypes.string,
    loading: PropTypes.bool
};

InputModal.defaultProps = {
    type: 'input',
    input: '',
    cancel: c('Action').t`Cancel`,
    submit: c('Action').t`Submit`
};

export default InputModal;
