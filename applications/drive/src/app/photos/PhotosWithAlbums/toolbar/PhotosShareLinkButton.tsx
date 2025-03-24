import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import type { PhotoLink } from '../../../store';
import { isDecryptedLink } from '../../../store/_photos/utils/isDecryptedLink';
import { getSharedStatus } from '../../../utils/share';

interface Props {
    selectedLinks: PhotoLink[];
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

const PhotosShareLinkButton = ({ selectedLinks, showIconOnly, dropDownMenuButton = false }: Props) => {
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const link = selectedLinks[0];

    if (!link) {
        return null;
    }

    if (!isDecryptedLink(link)) {
        return (
            <ToolbarButton
                title={c('Action').t`Loading link`}
                disabled
                icon={<CircleLoader />}
                data-testid="toolbar-share-link"
            />
        );
    }

    const sharedStatus = getSharedStatus(link);
    const hasSharedLink = !!link.shareUrl;
    const iconName = sharedStatus === 'shared' ? 'users' : 'user-plus';
    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;

    return (
        <>
            <ButtonComp
                title={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
                onClick={() => showLinkSharingModal({ shareId: link.rootShareId, linkId: link.linkId })}
                data-testid={hasSharedLink ? 'toolbar-manage-link' : 'toolbar-share-link'}
                className="inline-flex flex-nowrap flex-row items-center"
            >
                <Icon name={iconName} className={clsx(!showIconOnly && 'mr-2')} />
                <span className={clsx(showIconOnly && 'sr-only')}>
                    {hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Share`}
                </span>
            </ButtonComp>
            {linkSharingModal}
        </>
    );
};

export default PhotosShareLinkButton;
