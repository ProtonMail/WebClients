import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';

import { useFileSharingModal } from '../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';

interface Props {
    shareId: string;
}

const ShareButton = ({ shareId }: Props) => {
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Share`}
                icon={<IcUserPlus alt={c('Action').t`Share`} />}
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

export default ShareButton;
