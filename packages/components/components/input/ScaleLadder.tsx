import type { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import range from '@proton/utils/range';

import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';
import useUid from '../../hooks/useUid';
import ScaleLabel from './ScaleLabel';

interface ScaleProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
    from: number;
    to: number;
    fromLabel: string;
    toLabel: string;
    value?: number;
    onChange: (value: number) => void;
}

const ScaleLadder = ({ from, to, fromLabel, toLabel, value, onChange, ...rest }: ScaleProps) => {
    const scale = range(from, to + 1);
    const scaleId = useUid('scale');
    const scaleFromToId = useUid('scale-from-to');
    const breakpoint = useActiveBreakpoint();

    const viewportWidthIsSmall = breakpoint.viewportWidth['<=small'];

    return (
        <div className={'w-full inline-flex flex-column gap-2'} {...rest}>
            {viewportWidthIsSmall && <span className="text-sm m-0">{fromLabel}</span>}
            <div role="radiogroup" className="unstyled m-0 flex justify-center gap-1 sm:gap-2">
                {scale.map((n) => {
                    const isSelected = n === value;
                    return (
                        <Button
                            key={n}
                            id={`${scaleId}-${n}`}
                            name={scaleId}
                            value={n}
                            title={String(n)}
                            aria-label={c('Action').t`Select rating ${n} out of ${to}`}
                            color={isSelected ? 'norm' : undefined}
                            onClick={() => onChange(n)}
                            size={viewportWidthIsSmall ? 'large' : 'medium'}
                            aria-pressed={isSelected}
                        >
                            {n}
                        </Button>
                    );
                })}
            </div>
            {viewportWidthIsSmall ? (
                <span className="flex justify-end text-sm m-0">{toLabel}</span>
            ) : (
                <ScaleLabel id={scaleFromToId} fromLabel={fromLabel} toLabel={toLabel} />
            )}
        </div>
    );
};

export default ScaleLadder;
