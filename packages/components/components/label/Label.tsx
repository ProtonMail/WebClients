import { LabelHTMLAttributes } from 'react';
import { classnames } from '../../helpers';

type Props = LabelHTMLAttributes<HTMLLabelElement>;

const Label = ({ htmlFor, className, children, ...rest }: Props) => {
    return (
        <label htmlFor={htmlFor} className={classnames(['label', className])} {...rest}>
            {children}
        </label>
    );
};

export default Label;
