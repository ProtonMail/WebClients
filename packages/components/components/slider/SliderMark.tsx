import { ComponentPropsWithoutRef } from 'react';

import './SliderMark.scss';
import { classnames } from '../../helpers';

const SliderMark = ({ children, className, ...rest }: ComponentPropsWithoutRef<'span'>) => {
    return (
        <span className={classnames(['slider-mark', className])} {...rest}>
            <span className="slider-mark-label">{children}</span>
        </span>
    );
};

export default SliderMark;
