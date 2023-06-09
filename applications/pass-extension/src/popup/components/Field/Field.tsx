import type { ComponentType, ReactNode } from 'react';

import type { FieldValidator, FieldProps as FormikFieldProps, GenericFieldHTMLAttributes } from 'formik';
import { Field as FormikField } from 'formik';

type FieldProps = GenericFieldHTMLAttributes & { name: string; validate?: FieldValidator };

type Props<T extends FormikFieldProps> = {
    component: ComponentType<T>;
    name: string;
    children?: ReactNode;
} & Omit<T, keyof FormikFieldProps> &
    FieldProps;

export const Field = <T extends FormikFieldProps>(props: Props<T>) => <FormikField {...props} />;
