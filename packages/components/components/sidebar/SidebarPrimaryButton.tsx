import { Ref, forwardRef } from 'react';

import { classnames } from '../../helpers';
import Button, { ButtonProps } from '../button/Button';

const SidebarPrimaryButton = ({ children, className = '', ...rest }: ButtonProps, ref: Ref<HTMLButtonElement>) => {
    return (
        <Button color="norm" size="large" className={classnames(['w100', className])} ref={ref} {...rest}>
            {children}
        </Button>
    );
};

export default forwardRef<HTMLButtonElement, ButtonProps>(SidebarPrimaryButton);
