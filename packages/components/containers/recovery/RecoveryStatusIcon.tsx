import Icon, { IconProps } from '../../components/icon/Icon';
import { classnames } from '../../helpers';
import RecoveryStatus from './RecoveryStatus';

interface Props extends Omit<IconProps, 'name' | 'size'> {
    status: RecoveryStatus;
}

const RecoveryStatusIcon = ({ status, className, ...rest }: Props) => {
    let config = {
        name: 'circle-check-filled',
        className: 'color-success',
    };

    if (status === 'intermediate' || status === 'incomplete') {
        config = {
            name: 'circle-exclamation-filled',
            className: 'color-danger',
        };
    }

    return <Icon className={classnames([config.className, className])} name={config.name} size={18} {...rest} />;
};

export default RecoveryStatusIcon;
