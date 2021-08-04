import * as React from 'react';
import { classnames } from '../../helpers';

const SettingsSection = ({ className, ...rest }: React.ComponentPropsWithoutRef<'div'>) => {
    return <div className={classnames(['max-w46e', className])} {...rest} />;
};

export default SettingsSection;
