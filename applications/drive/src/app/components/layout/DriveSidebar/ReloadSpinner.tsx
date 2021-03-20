import React from 'react';
import { Icon, classnames } from 'react-components';

interface Props {
    refreshing?: boolean;
}

const ReloadSpinner = ({ refreshing = false }: Props) => {
    return <Icon className={classnames(['mr0-5', refreshing && 'location-refresh-rotate'])} name="reload" />;
};

export default ReloadSpinner;
