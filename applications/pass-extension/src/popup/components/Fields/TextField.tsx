import type { VFC } from 'react';

import { TextInputControl, Props as TextInputControlProps } from '../Controls/TextInputControl';
import { AbstractField, type AbstractFieldProps } from './AbstractField';

export const TextField: VFC<AbstractFieldProps<TextInputControlProps>> = (props) => (
    <AbstractField<TextInputControlProps> {...props}>
        {(inputControlProps) => <TextInputControl {...inputControlProps} />}
    </AbstractField>
);
