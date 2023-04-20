/**
 * TODO: this component is still used in the Exporter
 * and the ImportForm components. Disabled password
 * generation on this component for now.. It was used
 * in the Exporter to generate a password for PGP
 * encryption but we can do without for now..
 */
import type { FC } from 'react';

import type { FieldProps } from 'formik';

import { InputFieldTwo, PasswordInputTwo } from '@proton/components';
import type { InputFieldOwnProps } from '@proton/components/components/v2/field/InputField';

type PasswordFieldProps = FieldProps & InputFieldOwnProps;

const PasswordField: FC<PasswordFieldProps> = ({ field, form, ...rest }) => {
    const { name } = field;
    const { touched, errors } = form;
    const error = touched[name] && errors[name];

    return (
        <div className="flex flex-nowrap flex-align-items-end mb-3">
            <InputFieldTwo dense as={PasswordInputTwo} error={error} {...field} {...rest} />
        </div>
    );
};

export default PasswordField;
