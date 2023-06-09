import type { FC } from 'react';

import type { FieldProps } from 'formik';

import { InputFieldTwo, TextAreaTwo } from '@proton/components';
import type { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';

const TextAreaField: FC<FieldProps & InputFieldOwnProps> = ({ field, form, ...rest }) => {
    const { name } = field;
    const { touched, errors } = form;
    const error = touched[name] && errors[name];

    return <InputFieldTwo dense error={error} as={TextAreaTwo} minRows={2} rows={15} autoGrow {...field} {...rest} />;
};

export default TextAreaField;
