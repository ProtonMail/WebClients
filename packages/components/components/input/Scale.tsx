import { ChangeEvent, ComponentPropsWithoutRef, useRef } from 'react';
import range from '@proton/utils/range';

import InputButton, { InputButtonProps } from './InputButton';
import { classnames, concatStringProp, generateUID } from '../../helpers';

export interface ScaleProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
    from: number;
    to: number;
    fromLabel: string;
    toLabel: string;
    value?: number;
    InputButtonProps?: Partial<InputButtonProps>;
    onChange: (value: number) => void;
    className?: string;
}

const Scale = ({ from, to, fromLabel, toLabel, value, InputButtonProps, onChange, className, ...rest }: ScaleProps) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
    };

    const scale = range(from, to + 1);

    const { current: scaleFromToId } = useRef(generateUID('scale-from-to'));

    const ariaDescribedBy = concatStringProp([InputButtonProps?.['aria-describedby'], scaleFromToId]);

    return (
        <div className={classnames([className, 'inline-flex flex-column flex-gap-1'])} {...rest}>
            <div className="flex flex-justify-start flex-align-items-center flex-gap-1">
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
            <div id={scaleFromToId} className="flex flex-justify-space-between flex-align-items-start flex-gap-1">
                <span className="text-sm m0">{fromLabel}</span>
                <span className="text-sm m0">{toLabel}</span>
            </div>
        </div>
    );
};

export default Scale;
