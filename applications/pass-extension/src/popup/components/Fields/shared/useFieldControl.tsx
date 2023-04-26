import type { FieldProps } from 'formik';

type UseFieldControlProps = FieldProps & { [key: string]: any };

export const useFieldControl = (props: UseFieldControlProps) => {
    const { field, form } = props;
    const { name } = field;
    const { touched, errors } = form;
    const error = touched[name] && errors[name];
    return { error };
};
