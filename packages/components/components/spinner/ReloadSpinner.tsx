import { Icon, IconProps, classnames } from '@proton/components/index';

import './ReloadSpinner.scss';

interface Props extends Omit<IconProps, 'name'> {
    refreshing?: boolean;
}

const ReloadSpinner = ({ className, refreshing = false, ...rest }: Props) => {
    return (
        <Icon
            name="arrow-rotate-right"
            className={classnames([className, refreshing && 'location-refresh-rotate'])}
            {...rest}
        />
    );
};

export default ReloadSpinner;
