import { Icon, IconProps, classnames } from '@proton/components';

import './ReloadSpinner.scss';

interface Props extends Omit<IconProps, 'name'> {
    refreshing?: boolean;
    onRefresh?: () => void;
}

const ReloadSpinner = ({ className, refreshing = false, onRefresh, ...rest }: Props) => {
    const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
        if (refreshing) {
            return;
        }
        event.preventDefault();
        onRefresh?.();
    };
    return (
        <Icon
            onClick={handleClick}
            name="arrow-rotate-right"
            className={classnames([className, refreshing && 'location-refresh-rotate'])}
            {...rest}
        />
    );
};

export default ReloadSpinner;
