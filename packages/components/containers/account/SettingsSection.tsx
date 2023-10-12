import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsSection = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={clsx(['max-w-custom', className])} style={{ '--max-w-custom': '46em' }} {...rest} />;
};

export default SettingsSection;
