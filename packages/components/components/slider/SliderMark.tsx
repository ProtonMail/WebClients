import { ComponentPropsWithoutRef } from 'react';

import './SliderMark.scss';

const SliderMark = ({ children, ...rest }: ComponentPropsWithoutRef<'span'>) => {
    return (
        <span className="slider-mark" {...rest}>
            <span className="slider-mark-label">{children}</span>
        </span>
    );
};

export default SliderMark;
