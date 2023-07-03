import { type RefObject, type VFC, useEffect } from 'react';
import useIMask from 'react-imask/esm/hook';

import { type FactoryOpts } from 'imask/esm/masked/factory';

import noop from '@proton/utils/noop';

import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';
import { BaseTextField, type BaseTextFieldProps } from './TextField';

export type BaseMaskedTextFieldProps = BaseTextFieldProps & {
    mask: FactoryOpts;
};

export const BaseMaskedTextField: VFC<BaseMaskedTextFieldProps> = ({ mask, ...props }) => {
    const { name } = props.field;
    const { setFieldValue } = props.form;
    const { ref, value, unmaskedValue, setTypedValue, setUnmaskedValue } = useIMask(mask);

    const setInputValue = (value: string) => {
        setTypedValue(value);
        setUnmaskedValue(value);
    };

    useEffect(() => setInputValue(props.field.value), []);

    useEffect(() => {
        setFieldValue(name, unmaskedValue).catch(noop);
    }, [unmaskedValue]);

    return (
        <BaseTextField
            hiddenValue={value.replace(/[^\s]/g, '•')}
            {...props}
            field={{
                ...props.field,
                onChange: noop,
                value,
            }}
            ref={ref as RefObject<HTMLInputElement>}
        />
    );
};

export type MaskedTextFieldProps = FieldBoxProps & BaseMaskedTextFieldProps;

export const MaskedTextField: VFC<MaskedTextFieldProps> = (props) => {
    const { actions, actionsContainerClassName, className, icon, ...rest } = props;

    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <BaseMaskedTextField {...rest} />
        </FieldBox>
    );
};
