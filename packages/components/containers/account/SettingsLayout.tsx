import * as React from 'react';

import { classnames } from '../../helpers';
import './SettingsLayout.scss';

const SettingsLayout = ({ className = '', ...rest }: React.ComponentPropsWithoutRef<'div'>) => {
    return <div className={classnames(['settings-layout', className])} {...rest} />;
};

export default SettingsLayout;
