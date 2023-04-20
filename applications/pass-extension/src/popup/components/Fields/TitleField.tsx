import type { VFC } from 'react';

import { type Props as TextInputControlProps } from '../Controls/TextInputControl';
import { type AbstractFieldProps } from './AbstractField';
import { TextField } from './TextField';

import './TitleField.scss';

export const TitleField: VFC<AbstractFieldProps<TextInputControlProps>> = (props) => (
    <TextField {...props} inputClassName="pass-title-field text-bold color-norm p-0 rounded-none" />
);
