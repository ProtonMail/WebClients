import { ComponentPropsWithoutRef } from 'react';
import { classnames } from '../../helpers';

import './SettingsLayoutLeft.scss';

const SettingsLayoutLeft = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={classnames(['settings-layout-left', className])} {...rest} />;
};

export default SettingsLayoutLeft;
