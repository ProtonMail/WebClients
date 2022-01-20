import Icon, { IconProps } from '../../components/icon/Icon';
import { classnames } from '../../helpers';

interface Props extends Omit<IconProps, 'name' | 'size'> {
    type: 'info' | 'success' | 'warning' | 'danger';
}

const RecoveryStatusIcon = ({ type, className, ...rest }: Props) => {
    let config = {
        name: 'circle-info-filled',
        className: 'color-info',
    };

    if (type === 'success') {
        config = {
            name: 'circle-check-filled',
            className: 'color-success',
        };
    }

    if (type === 'warning') {
        config = {
            name: 'circle-exclamation-filled',
            className: 'color-warning',
        };
    }

    if (type === 'danger') {
        config = {
            name: 'circle-exclamation-filled',
            className: 'color-danger',
        };
    }

    return <Icon className={classnames([config.className, className])} name={config.name} size={18} {...rest} />;
};

export default RecoveryStatusIcon;
