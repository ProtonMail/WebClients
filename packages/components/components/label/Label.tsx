import React from 'react';
import { classnames } from '../../helpers';

type Props = React.LabelHTMLAttributes<HTMLLabelElement>;

const Label = ({ htmlFor, className, children, ...rest }: Props) => {
    return (
        <label htmlFor={htmlFor} className={classnames(['label', className])} {...rest}>
            {children}
        </label>
    );
};

export default Label;
