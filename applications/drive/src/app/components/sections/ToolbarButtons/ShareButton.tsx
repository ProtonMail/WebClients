import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useFileSharingModal } from '../../SelectLinkToShareModal/SelectLinkToShareModal';

interface Props {
    shareId: string;
}

const ShareButton = ({ shareId }: Props) => {
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Get link`}
                icon={<Icon name="link" />}
                onClick={() => {
                    void showFileSharingModal({ shareId });
                }}
                data-testid="toolbar-share-via-link"
            />
            {fileSharingModal}
        </>
    );
};

export default ShareButton;
