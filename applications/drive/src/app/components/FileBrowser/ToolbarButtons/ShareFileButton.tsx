import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';

interface Props {
    shareId: string;
}

const ShareFileButton = ({ shareId }: Props) => {
    const { openFileSharing } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={false}
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
