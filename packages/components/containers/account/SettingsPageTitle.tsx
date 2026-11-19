import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsPageTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, children, ...rest }, ref) => (
        <h1 ref={ref} className={clsx([className, 'text-bold'])} {...rest}>
            {children}
        </h1>
    )
);

SettingsPageTitle.displayName = 'SettingsPageTitle';

export default SettingsPageTitle;
