import { Icon, IconProps, classnames } from '@proton/components/index';

import './ReloadSpinner.scss';

interface Props extends Omit<IconProps, 'name'> {
    refreshing?: boolean;
    onRefresh?: (event: React.MouseEvent<Element>) => void;
}

const ReloadSpinner = ({ className, refreshing = false, onRefresh, ...rest }: Props) => {
    return (
        <Icon
            onClick={onRefresh}
            name="arrow-rotate-right"
            className={classnames([className, refreshing && 'location-refresh-rotate'])}
            {...rest}
        />
    );
};

export default ReloadSpinner;
