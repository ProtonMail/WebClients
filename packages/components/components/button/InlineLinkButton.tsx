import * as React from 'react';
import { classnames } from '../../helpers';

type Props = React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

const InlineLinkButton = ({ children, className = '', ...rest }: Props, ref: React.Ref<HTMLButtonElement>) => {
    return (
        <button type="button" className={classnames(['link align-baseline text-left', className])} ref={ref} {...rest}>
            {children}
        </button>
    );
};

export default React.forwardRef<HTMLButtonElement, Props>(InlineLinkButton);
