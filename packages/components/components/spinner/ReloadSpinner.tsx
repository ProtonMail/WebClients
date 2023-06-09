import { Icon, IconProps } from '@proton/components';
import clsx from '@proton/utils/clsx';

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
            className={clsx([className, refreshing && 'location-refresh-rotate'])}
            {...rest}
        />
    );
};

export default ReloadSpinner;
