import { type VFC } from 'react';

import type { BaseTextFieldProps } from './TextField';
import { BaseTextField, TextField, type TextFieldProps } from './TextField';

export const BaseTitleField: VFC<BaseTextFieldProps> = (props) => (
    <BaseTextField inputClassName="pass-input--title text-2xl text-bold" {...props} />
);

export const TitleField: VFC<TextFieldProps> = (props) => (
    <TextField inputClassName="pass-input--title text-2xl text-bold" {...props} />
);
