import * as React from 'react';
import Button, { ButtonProps } from './Button';
import { classnames } from '../../helpers';

interface Props extends ButtonProps {
    title?: string;
    className?: string;
}

const FloatingButton = ({ children, title, className, ...rest }: Props, ref: React.Ref<HTMLButtonElement>) => {
    return (
        <Button color="norm" className={classnames(['fab flex', className])} ref={ref} {...rest}>
            {children}
        </Button>
    );
};

export default React.forwardRef<HTMLButtonElement, Props>(FloatingButton);
