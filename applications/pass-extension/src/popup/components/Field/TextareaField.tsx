import { VFC } from 'react';

import { type FieldProps } from 'formik';

import { TextAreaTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../hooks/useFieldControl';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';

export type BaseTextAreaFieldProps = FieldProps & InputFieldProps<typeof TextAreaTwo>;

export const BaseTextAreaField: VFC<BaseTextAreaFieldProps> = (props) => {
    const { className, field, labelContainerClassName, ...rest } = props;

    const { error } = useFieldControl(props);

    return (
        <TextAreaTwo
            autoGrow
            unstyled
            className={clsx('border-none flex p-0 resize-none', className)}
            error={error}
            minRows={2}
            rows={Number.MAX_SAFE_INTEGER}
            {...field}
            {...rest}
        />
    );
};

export type TextAreaFieldProps = FieldBoxProps & BaseTextAreaFieldProps;

export const TextAreaField: VFC<TextAreaFieldProps> = (props) => {
    const { actions, actionsContainerClassName, className, icon, ...rest } = props;

    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <BaseTextAreaField {...rest} />
        </FieldBox>
    );
};
