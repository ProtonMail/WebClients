import { ComponentPropsWithoutRef } from 'react';
import { classnames } from '../../helpers';

const SettingsSectionWide = ({ className, ...rest }: ComponentPropsWithoutRef<'div'>) => {
    return <div className={classnames(['max-w69e', className])} {...rest} />;
};

export default SettingsSectionWide;
