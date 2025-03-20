import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';

interface Props {
    shareId: string;
    linkId: string;
}

const ShareLinkButton = ({ shareId, linkId }: Props) => {
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    return (
        <>
            <ToolbarButton
                title={c('Action').t`Share`}
                icon={<Icon name="user-plus" alt={c('Action').t`Share`} />}
                onClick={() => showLinkSharingModal({ shareId, linkId })}
                data-testid="toolbar-share-link"
            />
            {linkSharingModal}
        </>
    );
};

export default ShareLinkButton;
