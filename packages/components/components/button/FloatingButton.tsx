import { Ref, forwardRef } from 'react';

import { classnames } from '../../helpers';
import Button, { ButtonProps } from './Button';

interface Props extends ButtonProps {
    title?: string;
    className?: string;
}

const FloatingButton = ({ children, title, className, ...rest }: Props, ref: Ref<HTMLButtonElement>) => {
    return (
        <Button color="norm" className={classnames(['fab flex', className])} ref={ref} {...rest}>
            {children}
        </Button>
    );
};

export default forwardRef<HTMLButtonElement, Props>(FloatingButton);
