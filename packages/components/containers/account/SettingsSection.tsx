import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsSection = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={clsx(['max-w46e', className])} {...rest} />;
};

export default SettingsSection;
