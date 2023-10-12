import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsSectionExtraWide = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={clsx(['max-w-custom', className])} style={{ '--max-w-custom': '82em' }} {...rest} />;
};

export default SettingsSectionExtraWide;
