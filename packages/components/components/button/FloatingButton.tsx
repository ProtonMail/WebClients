import { Ref, forwardRef } from 'react';

import { Button, ButtonProps } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

interface Props extends ButtonProps {
    title?: string;
    className?: string;
}

const FloatingButton = ({ children, title, className, ...rest }: Props, ref: Ref<HTMLButtonElement>) => {
    return (
        <Button color="norm" className={clsx(['fab flex', className])} ref={ref} {...rest}>
            {children}
        </Button>
    );
};

export default forwardRef<HTMLButtonElement, Props>(FloatingButton);
