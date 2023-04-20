import type { VFC } from 'react';

import { InputFieldTwo } from '@proton/components';

import { CustomInputControl, type InputControlProps } from './InputControl';
import { RadioButtonGroup } from './RadioButtonGroup';

export type Props = InputControlProps<typeof RadioButtonGroup>;

export const RadioButtonGroupControl: VFC<Props> = (props) => {
    return (
        <CustomInputControl {...props}>
            {(inputProps) => (
                <InputFieldTwo<typeof RadioButtonGroup>
                    as={RadioButtonGroup}
                    assistContainerClassName="hidden-empty"
                    {...props}
                    {...inputProps}
                />
            )}
        </CustomInputControl>
    );
};
