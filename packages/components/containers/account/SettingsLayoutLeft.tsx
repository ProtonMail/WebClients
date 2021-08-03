import * as React from 'react';

import { classnames } from '../../helpers';

import './SettingsLayoutLeft.scss';

const SettingsLayoutLeft = ({ className, ...rest }: React.ComponentPropsWithoutRef<'div'>) => {
    return <div className={classnames(['settings-layout-left', className])} {...rest} />;
};

export default SettingsLayoutLeft;
