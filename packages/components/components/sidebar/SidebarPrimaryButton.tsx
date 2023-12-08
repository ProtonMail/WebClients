import { Ref, forwardRef } from 'react';

import { Button, ButtonProps } from '@proton/atoms';
import { isElectronOnWindows } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

const SidebarPrimaryButton = ({ children, className = '', ...rest }: ButtonProps, ref: Ref<HTMLButtonElement>) => {
    const isElectronWindows = isElectronOnWindows();

    return (
        <Button
            color="norm"
            size={isElectronWindows ? 'medium' : 'large'}
            className={clsx(['w-full', className])}
            ref={ref}
            {...rest}
        >
            {children}
        </Button>
    );
};

export default forwardRef<HTMLButtonElement, ButtonProps>(SidebarPrimaryButton);
