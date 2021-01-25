import React from 'react';
import { c } from 'ttag';
import { Icon, Tooltip } from 'react-components';

interface Props {
    expired: boolean;
}

const SharedURLIcon = ({ expired }: Props) => {
    return (
        <Tooltip
            title={expired ? c('Tooltip').t`Expired sharing link` : c('Tooltip').t`Active sharing link`}
            className="ml1 flex flex-item-noshrink"
        >
            <Icon className={expired ? 'color-global-altgrey' : 'color-primary'} name="link" />
        </Tooltip>
    );
};

export default SharedURLIcon;
