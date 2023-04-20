import type { VFC } from 'react';

import { Props as TextareControlProps, TextareaControl } from '../Controls/TextareaControl';
import { AbstractField, type AbstractFieldProps } from './AbstractField';

export const TextAreaField: VFC<AbstractFieldProps<TextareControlProps>> = (props) => (
    <AbstractField<TextareControlProps> {...props}>
        {(inputControlProps) => <TextareaControl {...inputControlProps} />}
    </AbstractField>
);
