import { ComponentPropsWithoutRef } from 'react';

import clsx from '../clsx';
import './SliderMark.scss';

const SliderMark = ({ children, className, ...rest }: ComponentPropsWithoutRef<'span'>) => {
    return (
        <span className={clsx(['slider-mark', className])} {...rest}>
            <span className="slider-mark-label">{children}</span>
        </span>
    );
};

export default SliderMark;
