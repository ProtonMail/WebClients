import { classnames } from '@proton/components/helpers';
import { ComponentPropsWithoutRef } from 'react';

import './VerticalSteps.scss';

export interface VerticalStepsProps extends ComponentPropsWithoutRef<'ul'> {}

const VerticalSteps = ({ className, ...rest }: VerticalStepsProps) => {
    return <ul {...rest} className={classnames(['unstyled flex flex-column flex-nowrap vertical-steps', className])} />;
};

export default VerticalSteps;
