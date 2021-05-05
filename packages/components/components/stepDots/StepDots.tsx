import React from 'react';

import { classnames } from '../../helpers';
import { Props as StepDotProps } from '../stepDot/StepDot';

export interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange'> {
    value: number;
    onChange?: (index: number) => void;
    children: React.ReactElement<StepDotProps>[];
}

const StepDots = ({ value, onChange, children, className, ...rest }: Props) => {
    const clonedChildren = React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
            active: index === value,
            index,
            onChange,
        })
    );

    return (
        <nav {...rest} className={classnames([className, 'step-dots-container'])}>
            <ul className="step-dots-list unstyled inline-flex flex-row" role="tablist">
                {clonedChildren}
            </ul>
        </nav>
    );
};

export default StepDots;
