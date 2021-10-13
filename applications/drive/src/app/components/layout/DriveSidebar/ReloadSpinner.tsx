import { Icon, classnames } from '@proton/components';

interface Props {
    refreshing?: boolean;
}

const ReloadSpinner = ({ refreshing = false }: Props) => {
    return (
        <Icon className={classnames(['mr0-5', refreshing && 'location-refresh-rotate'])} name="arrow-rotate-right" />
    );
};

export default ReloadSpinner;
