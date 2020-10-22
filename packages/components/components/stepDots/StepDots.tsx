import React from 'react';

import { Props as StepDotProps } from '../stepDot/StepDot';

export interface Props extends Omit<React.HTMLProps<HTMLDivElement>, 'onChange'> {
    value: number;
    onChange: (index: number | undefined) => void;
    children: React.ReactElement<StepDotProps>[];
}

const StepDots = ({ value, onChange, children, ...rest }: Props) => {
    const clonedChildren = React.Children.map(children, (child, index) =>
        React.cloneElement(child, {
            active: index === value,
            index,
            onChange,
        })
    );

    return (
        <nav {...rest} className="stepDots-container">
            <ul className="stepDots-list" role="tablist">
                {clonedChildren}
            </ul>
        </nav>
    );
};

export default StepDots;
