import type { VFC } from 'react';

import { Input } from '@proton/atoms/Input';

import { InputControl, type InputControlProps } from './InputControl';

export type Props = InputControlProps<typeof Input> & { type?: 'text' | 'password' };

export const TextInputControl: VFC<Props> = (props) => (
    <InputControl<typeof Input>
        unstyled
        className="border-none"
        inputClassName="color-norm p-0 rounded-none"
        {...props}
    />
);
