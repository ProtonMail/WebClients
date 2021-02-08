import React from 'react';
import { c } from 'ttag';

import { FEATURE_FLAGS } from 'proton-shared/lib/constants';
import { Icon, Tooltip } from 'react-components';

interface Props {
    expired: boolean;
}

const SharedURLIcon = ({ expired }: Props) => {
    const includeDriveSharing = FEATURE_FLAGS.includes('drive-sharing');

    return (
        <Tooltip
            title={
                includeDriveSharing && expired
                    ? c('Tooltip').t`Expired sharing link`
                    : c('Tooltip').t`Active sharing link`
            }
            className="ml1 flex flex-item-noshrink"
        >
            <Icon className={includeDriveSharing && expired ? 'color-global-altgrey' : 'color-primary'} name="link" />
        </Tooltip>
    );
};

export default SharedURLIcon;
