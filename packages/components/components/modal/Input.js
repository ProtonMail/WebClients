import { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import FormModal from './FormModal';
import Input from '../input/Input';
import TextArea from '../input/TextArea';
import Label from '../label/Label';
import Row from '../container/Row';
import Field from '../container/Field';

import { generateUID } from '../../helpers';

const InputField = ({ type, id, value, placeholder, onChange }) => {
    if (type === 'textarea') {
        return <TextArea id={id} value={value} placeholder={placeholder} onChange={onChange} autoFocus required />;
    }

    return <Input id={id} value={value} placeholder={placeholder} onChange={onChange} autoFocus required />;
};

InputField.propTypes = {
    type: PropTypes.string,
    id: PropTypes.string,
    value: PropTypes.string,
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
};

const InputModal = ({
    label,
    type = 'input',
    title,
    input: initialInput = '',
    onClose,
    onSubmit,
    cancel = c('Action').t`Cancel`,
    submit = c('Action').t`Submit`,
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
    type: PropTypes.string,
    input: PropTypes.string,
    onClose: PropTypes.func,
    label: PropTypes.string.isRequired,
    onSubmit: PropTypes.func,
    title: PropTypes.string.isRequired,
    cancel: PropTypes.string,
    placeholder: PropTypes.string,
    submit: PropTypes.string,
    loading: PropTypes.bool,
};

export default InputModal;
