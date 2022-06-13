import { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import range from '@proton/utils/range';

import InputButton, { InputButtonProps } from './InputButton';
import { classnames, concatStringProp } from '../../helpers';
import useUid from '../../hooks/useUid';
import ScaleLabel from './ScaleLabel';

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

    const scaleId = useUid('scale');

    const scaleFromToId = useUid('scale-from-to');

    const ariaDescribedBy = concatStringProp([InputButtonProps?.['aria-describedby'], scaleFromToId]);

    return (
        <div className={classnames([className, 'inline-flex flex-column flex-gap-1'])} {...rest}>
            <div className="flex flex-justify-start flex-align-items-center flex-gap-1">
                {scale.map((n) => (
                    <InputButton
                        key={n}
                        id={`${scaleId}-${n}`}
                        name={scaleId}
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
            <ScaleLabel id={scaleFromToId} fromLabel={fromLabel} toLabel={toLabel} />
        </div>
    );
};

export default Scale;
