import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsSectionExtraWide = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={clsx(['max-w82e', className])} {...rest} />;
};

export default SettingsSectionExtraWide;
