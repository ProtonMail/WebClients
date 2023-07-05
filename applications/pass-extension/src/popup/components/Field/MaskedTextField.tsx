import { type RefObject, type VFC } from 'react';

import { type FactoryOpts } from 'imask/esm/masked/factory';

import noop from '@proton/utils/noop';

import { useFieldMask } from '../../hooks/useFieldMask';
import { FieldBox, type FieldBoxProps } from './Layout/FieldBox';
import { BaseTextField, type BaseTextFieldProps } from './TextField';

export type MaskedTextFieldProps = FieldBoxProps &
    BaseTextFieldProps & {
        mask: FactoryOpts;
    };

export const MaskedTextField: VFC<MaskedTextFieldProps> = (props) => {
    const { actions, actionsContainerClassName, className, icon, mask, ...rest } = props;
    const { inputRef, maskedValue } = useFieldMask(props, mask);

    return (
        <FieldBox
            actions={actions}
            actionsContainerClassName={actionsContainerClassName}
            className={className}
            icon={icon}
        >
            <BaseTextField
                {...rest}
                field={{
                    ...props.field,
                    onChange: noop,
                    value: maskedValue,
                }}
                ref={inputRef as RefObject<HTMLInputElement>}
            />
        </FieldBox>
    );
};
