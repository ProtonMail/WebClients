import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsSectionWide = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={clsx(['max-w69e', className])} {...rest} />;
};

export default SettingsSectionWide;
