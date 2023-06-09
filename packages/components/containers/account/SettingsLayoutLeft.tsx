import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SettingsLayoutLeft.scss';

const SettingsLayoutLeft = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={clsx(['settings-layout-left', className])} {...rest} />;
};

export default SettingsLayoutLeft;
