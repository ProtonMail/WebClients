import type { FieldProps } from 'formik';

export const useFieldControl = (props: FieldProps) => {
    const { field, form } = props;
    const { name } = field;
    const { touched, errors } = form;
    const error = touched[name] && errors[name];
    return { error };
};
