import React from 'react';
import { c } from 'ttag';

import { Icon, Tooltip } from 'react-components';

interface Props {
    expired: boolean;
    className?: string;
}

const SharedURLIcon = ({ expired, className }: Props) => {
    return (
        <Tooltip title={expired ? c('Tooltip').t`Expired sharing link` : c('Tooltip').t`Active sharing link`}>
            <span className={className || 'flex flex-item-noshrink'}>
                <Icon className={!expired ? 'color-info' : 'color-weak'} name="link" />
            </span>
        </Tooltip>
    );
};

export default SharedURLIcon;
