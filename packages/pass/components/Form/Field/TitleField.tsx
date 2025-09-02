import type { FC } from 'react';

import type { BaseTextFieldProps } from './TextField';
import { BaseTextField, TextField, type TextFieldProps } from './TextField';

export const BaseTitleField: FC<BaseTextFieldProps> = (props) => (
    <BaseTextField inputClassName="pass-input--title text-2xl text-bold" {...props} />
);

export const TitleField: FC<TextFieldProps> = (props) => (
    <TextField inputClassName="pass-input--title text-2xl text-bold" {...props} />
);
