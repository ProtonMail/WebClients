import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import type { IconName, IconProps } from '../../components/icon/Icon';

interface Props extends Omit<IconProps, 'name' | 'size'> {
    type: 'info' | 'success' | 'warning' | 'danger';
}

const RecoveryStatusIcon = ({ type, className, ...rest }: Props) => {
    let config: { name: IconName; className: string } = {
        name: 'info-circle-filled',
        className: 'color-info',
    };

    if (type === 'success') {
        config = {
            name: 'checkmark-circle-filled',
            className: 'color-success',
        };
    }

    if (type === 'warning') {
        config = {
            name: 'exclamation-circle-filled',
            className: 'color-warning',
        };
    }

    if (type === 'danger') {
        config = {
            name: 'exclamation-circle-filled',
            className: 'color-danger',
        };
    }

    return <Icon className={clsx([config.className, className])} name={config.name} size={4.5} {...rest} />;
};

export default RecoveryStatusIcon;
