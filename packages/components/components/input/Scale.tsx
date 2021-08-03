import { useRef } from 'react';
import * as React from 'react';
import { range } from '@proton/shared/lib/helpers/array';

import InputButton, { InputButtonProps } from './InputButton';
import { concatStringProp, generateUID } from '../../helpers';

export interface ScaleProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
    from: number;
    to: number;
    fromLabel: string;
    toLabel: string;
    value?: number;
    InputButtonProps?: Partial<InputButtonProps>;
    onChange: (value: number) => void;
}

const Scale = ({ from, to, fromLabel, toLabel, value, InputButtonProps, onChange, ...rest }: ScaleProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    const scale = range(from, to + 1);

    const { current: scaleFromToId } = useRef(generateUID('scale-from-to'));

    const ariaDescribedBy = concatStringProp([InputButtonProps?.['aria-describedby'], scaleFromToId]);

    return (
        <div {...rest}>
            <div className="scale-buttons-container">
                {scale.map((n) => (
                    <InputButton
                        key={n}
                        id={`score-${n}`}
                        name="score"
                        type="radio"
                        value={n}
                        title={String(n)}
                        checked={value === n}
                        onChange={handleChange}
                        {...InputButtonProps}
                        aria-describedby={ariaDescribedBy}
                    >
                        {n}
                    </InputButton>
                ))}
            </div>
            <div id={scaleFromToId} className="flex flex-justify-space-between mt0-5">
                <span className="text-sm m0">{fromLabel}</span>
                <span className="text-sm m0">{toLabel}</span>
            </div>
        </div>
    );
};

export default Scale;
