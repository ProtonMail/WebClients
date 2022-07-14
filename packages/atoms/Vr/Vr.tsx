import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './Vr.scss';

export interface VrProps extends ComponentPropsWithoutRef<'span'> {}

// Vr stands for Vertical Rule
const Vr = ({ className, ...rest }: VrProps) => {
    return <span className={clsx('vr', className)} {...rest} />;
};

export default Vr;
