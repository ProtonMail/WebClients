import type { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './VerticalSteps.scss';

export interface VerticalStepsProps extends ComponentPropsWithoutRef<'ul'> {}

export const VerticalSteps = ({ className, ...rest }: VerticalStepsProps) => {
    return <ul {...rest} className={clsx(['unstyled flex flex-column flex-nowrap vertical-steps', className])} />;
};
