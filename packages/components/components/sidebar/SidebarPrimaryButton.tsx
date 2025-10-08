import type { Ref } from 'react';
import { forwardRef } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { isElectronOnWindows } from '@proton/shared/lib/helpers/desktop';
import clsx from '@proton/utils/clsx';

const SidebarPrimaryButton = (
    { children, className = '', size, ...rest }: ButtonProps,
    ref: Ref<HTMLButtonElement>
) => {
    return (
        <Button
            color="norm"
            size={size || isElectronOnWindows ? 'medium' : 'large'}
            className={clsx(['w-full', className])}
            ref={ref}
            {...rest}
        >
            {children}
        </Button>
    );
};

export default forwardRef<HTMLButtonElement, ButtonProps>(SidebarPrimaryButton);
