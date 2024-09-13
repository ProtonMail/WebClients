import type { HTMLProps, ReactElement } from 'react';
import { Children, cloneElement } from 'react';

import clsx from '@proton/utils/clsx';

import type { Props as StepDotProps } from '../stepDot/StepDot';

interface Props extends Omit<HTMLProps<HTMLDivElement>, 'onChange'> {
    value: number;
    onChange?: (index: number) => void;
    ulClassName?: string;
    children: ReactElement<StepDotProps>[];
}

const StepDots = ({ value, onChange, children, className, ulClassName, ...rest }: Props) => {
    const clonedChildren = Children.map(children, (child, index) =>
        cloneElement(child, {
            active: index === value,
            index,
            onChange,
        })
    );

    return (
        <nav {...rest} className={clsx([className, 'step-dots-container'])}>
            <ul className={clsx(['step-dots-list unstyled inline-flex flex-row', ulClassName])} role="tablist">
                {clonedChildren}
            </ul>
        </nav>
    );
};

export default StepDots;
