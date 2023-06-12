import { HTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsPageTitle = ({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={clsx([className, 'text-bold'])} {...rest}>
        {children}
    </h1>
);

export default SettingsPageTitle;
