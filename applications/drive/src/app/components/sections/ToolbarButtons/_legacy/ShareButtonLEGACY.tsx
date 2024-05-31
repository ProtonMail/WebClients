import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useFileSharingModal } from '../../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';

interface Props {
    shareId: string;
}

const ShareButtonLEGACY = ({ shareId }: Props) => {
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Get link`}
                icon={<Icon name="link" alt={c('Action').t`Get link`} />}
                onClick={() => {
                    void showFileSharingModal({ shareId, showLinkSharingModal });
                }}
                data-testid="toolbar-share-via-link"
            />
            {fileSharingModal}
            {linkSharingModal}
        </>
    );
};

export default ShareButtonLEGACY;
