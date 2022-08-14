import { HTMLAttributes } from 'react';

import { classnames } from '../../helpers';

const SettingsPageTitle = ({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={classnames([className, 'text-bold'])} {...rest}>
        {children}
    </h1>
);

export default SettingsPageTitle;
