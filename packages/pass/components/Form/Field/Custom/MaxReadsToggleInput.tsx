import { type FC, type KeyboardEventHandler } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { InlineFieldBox } from '@proton/pass/components/Form/Field/Layout/InlineFieldBox';
import type { MaybeNull } from '@proton/pass/types';

import { IncrementableInput } from './IncrementableInput';

type Props = {
    disabled: boolean;
    value: MaybeNull<number>;
    onChange: (value: MaybeNull<number>) => void;
    onPressEnter?: KeyboardEventHandler<HTMLInputElement>;
};

export const [MIN_READS, MAX_READS] = [1, 1000];

export const MaxReadsToggleInput: FC<Props> = ({ disabled, value, onPressEnter, onChange }) => (
    <>
        <InlineFieldBox label={c('Action').t`Restrict number of views`}>
            <Toggle checked={Boolean(value)} onChange={() => onChange(value ? null : MIN_READS)} disabled={disabled} />
        </InlineFieldBox>

        {value && (
            <InlineFieldBox label={c('Action').t`Maximum views`}>
                <IncrementableInput
                    value={value}
                    onChange={onChange}
                    min={MIN_READS}
                    max={MAX_READS}
                    disabled={disabled}
                    onPressEnter={onPressEnter}
                />
            </InlineFieldBox>
        )}
    </>
);
