import type { HTMLAttributes } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsSectionTitle = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={clsx(className, 'text-bold mb-1')} {...rest}>
        {rest.children}
    </h2>
);

export default SettingsSectionTitle;
