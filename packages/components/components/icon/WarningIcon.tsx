import Icon from './Icon';
import { Tooltip } from '../tooltip';
import { classnames } from '../../helpers';

interface Props {
    warning: string;
    className?: string;
}

const WarningIcon = ({ warning, className }: Props) => {
    if (!warning.length) {
        return null;
    }

    const icon = <Icon name="triangle-exclamation" className={classnames([className, 'color-warning'])} />;
    return <Tooltip title={warning}>{icon}</Tooltip>;
};

export default WarningIcon;
