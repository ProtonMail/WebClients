import { Ref, forwardRef } from 'react';

import { Button, ButtonProps } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

const SidebarPrimaryButton = ({ children, className = '', ...rest }: ButtonProps, ref: Ref<HTMLButtonElement>) => {
    return (
        <Button color="norm" size="large" className={clsx(['w100', className])} ref={ref} {...rest}>
            {children}
        </Button>
    );
};

export default forwardRef<HTMLButtonElement, ButtonProps>(SidebarPrimaryButton);
