import { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SettingsLayoutRight.scss';

const SettingsLayoutRight = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={clsx(['settings-layout-right', className])} {...rest} />;
};

export default SettingsLayoutRight;
