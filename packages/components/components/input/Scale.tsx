import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';

import type { InputButtonProps } from '@proton/components/components/input/InputButton';
import InputButton from '@proton/components/components/input/InputButton';
import { concatStringProp } from '@proton/components/helpers/component';
import clsx from '@proton/utils/clsx';
import range from '@proton/utils/range';

import useUid from '../../hooks/useUid';
import ScaleLabel from './ScaleLabel';

interface ScaleProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
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
        <div className={clsx([className, 'inline-flex flex-column gap-4'])} {...rest}>
            <div className="flex justify-start items-center gap-4">
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
