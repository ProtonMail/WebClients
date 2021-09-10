import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef, Ref } from 'react';
import { classnames } from '../../helpers';

type Props = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;

const InlineLinkButton = ({ children, className = '', ...rest }: Props, ref: Ref<HTMLButtonElement>) => {
    return (
        <button type="button" className={classnames(['link align-baseline text-left', className])} ref={ref} {...rest}>
            {children}
        </button>
    );
};

export default forwardRef<HTMLButtonElement, Props>(InlineLinkButton);
