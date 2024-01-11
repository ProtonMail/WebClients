import type { FieldProps, FormikErrors } from 'formik';

export const maybeErrorMessage = <V = any, T = FormikErrors<V>[keyof FormikErrors<V>]>(error: T): string | false => {
    if (typeof error === 'string') return error;
    return false;
};

export const useFieldControl = (props: FieldProps): { error: false | string } => {
    const { field, form } = props;
    const { name } = field;
    const { touched, errors } = form;
    const error = touched[name] && errors[name];
    return { error: maybeErrorMessage(error) };
};
