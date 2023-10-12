import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

const SettingsSectionWide = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={clsx(['max-w-custom', className])} style={{ '--max-w-custom': '69em' }} {...rest} />;
};

export default SettingsSectionWide;
