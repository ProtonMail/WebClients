import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from 'react-components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';

interface Props {
    shareId: string;
    disabled?: boolean;
}

const ShareFileButton = ({ disabled, shareId }: Props) => {
    const { openFileSharing } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Share via link`}
            icon={<Icon name="link" />}
            onClick={() => {
                openFileSharing(shareId);
            }}
            data-testid="toolbar-shareViaLink"
        />
    );
};

export default ShareFileButton;
