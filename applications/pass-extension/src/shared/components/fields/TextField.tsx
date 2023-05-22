import type { FC, ReactNode } from 'react';

import type { FieldProps } from 'formik';

import { InputFieldTwo } from '@proton/components';
import type { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';

type TextFieldProps = FieldProps &
    InputFieldOwnProps & {
        action?: ReactNode;
    };

const TextField: FC<TextFieldProps> = ({ field, form, action, ...rest }) => {
    const { name } = field;
    const { touched, errors } = form;
    const error = touched[name] && errors[name];

    const content = <InputFieldTwo dense error={error} {...field} {...rest} />;

    return (
        <div className="flex flex-nowrap flex-align-items-end mb-3">
            {content}
            {action}
        </div>
    );
};

export default TextField;
