import { ComponentPropsWithoutRef } from 'react';

import clsx from '../clsx';
import './VerticalSteps.scss';

export interface VerticalStepsProps extends ComponentPropsWithoutRef<'ul'> {}

const VerticalSteps = ({ className, ...rest }: VerticalStepsProps) => {
    return <ul {...rest} className={clsx(['unstyled flex flex-column flex-nowrap vertical-steps', className])} />;
};

export default VerticalSteps;
