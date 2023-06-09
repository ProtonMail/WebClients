import { LabelHTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

type Props = LabelHTMLAttributes<HTMLLabelElement>;

const Label = ({ htmlFor, className, children, ...rest }: Props) => {
    return (
        <label htmlFor={htmlFor} className={clsx(['label', className])} {...rest}>
            {children}
        </label>
    );
};

export default Label;
