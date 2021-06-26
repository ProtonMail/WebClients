import React from 'react';

import { classnames } from '../../helpers';

import './SettingsLayoutRight.scss';

const SettingsLayoutRight = ({ className, ...rest }: React.ComponentPropsWithoutRef<'div'>) => {
    return <div className={classnames(['settings-layout-right', className])} {...rest} />;
};

export default SettingsLayoutRight;
