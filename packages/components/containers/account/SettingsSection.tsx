import { ComponentPropsWithoutRef } from 'react';

import { classnames } from '../../helpers';

interface Props extends ComponentPropsWithoutRef<'div'> {
    large?: boolean;
}

const SettingsSection = ({ className, large, ...rest }: Props) => {
    return <div className={classnames([large ? 'max-w60e' : 'max-w46e', className])} {...rest} />;
};

export default SettingsSection;
