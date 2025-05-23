import type { HTMLProps, ReactElement } from 'react';

import clsx from '@proton/utils/clsx';

import type { Props as StepDotProps } from '../stepDot/StepDot';

interface Props extends Omit<HTMLProps<HTMLDivElement>, 'onChange'> {
    ulClassName?: string;
    children: ReactElement<StepDotProps>[];
}

const StepDots = ({ children, className, ulClassName, ...rest }: Props) => (
    <nav {...rest} className={clsx(className, 'step-dots-container')}>
        <ul className={clsx('step-dots-list unstyled inline-flex flex-row', ulClassName)} role="tablist">
            {children}
        </ul>
    </nav>
);

export default StepDots;
