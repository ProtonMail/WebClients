import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useOpenModal from '../../useOpenModal';

interface Props {
    shareId: string;
}

const ShareButton = ({ shareId }: Props) => {
    const { openFileSharing } = useOpenModal();

    return (
        <ToolbarButton
            title={c('Action').t`Get link`}
            icon={<Icon name="link" />}
            onClick={() => {
                openFileSharing(shareId);
            }}
            data-testid="toolbar-shareViaLink"
        />
    );
};

export default ShareButton;
