import React from 'react';
import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { FileBrowserItem } from '../interfaces';
import { noSelection } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const DownloadButton = ({ shareId, selectedItems }: Props) => {
    const { download } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={noSelection(selectedItems)}
            title={c('Action').t`Download`}
            icon={<Icon name="download" />}
            onClick={() => download(shareId, selectedItems)}
            data-testid="toolbar-download"
        />
    );
};

export default DownloadButton;
