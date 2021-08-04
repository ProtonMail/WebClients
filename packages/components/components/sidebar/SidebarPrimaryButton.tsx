import * as React from 'react';

import Button, { ButtonProps } from '../button/Button';
import { classnames } from '../../helpers';

const SidebarPrimaryButton = (
    { children, className = '', ...rest }: ButtonProps,
    ref: React.Ref<HTMLButtonElement>
) => {
    return (
        <Button
            color="norm"
            size="large"
            className={classnames(['text-bold mt0-25 w100', className])}
            ref={ref}
            {...rest}
        >
            {children}
        </Button>
    );
};

export default React.forwardRef<HTMLButtonElement, ButtonProps>(SidebarPrimaryButton);
