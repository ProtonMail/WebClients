import { ComponentPropsWithoutRef } from 'react';

import { classnames } from '../../helpers';

const SettingsSection = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={classnames(['max-w46e', className])} {...rest} />;
};

export default SettingsSection;
