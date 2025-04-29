import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { PhotoLink } from '../../../store';
import { isDecryptedLink } from '../../../store/_photos/utils/isDecryptedLink';
import { getSharedStatus } from '../../../utils/share';

interface Props {
    selectedLink: PhotoLink | undefined;
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
    onClick: () => void;
}

const PhotosShareLinkButton = ({ selectedLink, showIconOnly, onClick, dropDownMenuButton = false }: Props) => {
    if (!selectedLink) {
        return null;
    }

    if (!isDecryptedLink(selectedLink)) {
        return (
            <ToolbarButton
                title={c('Action').t`Loading link`}
                disabled
                icon={<CircleLoader />}
                data-testid="toolbar-share-link"
            />
        );
    }

    const sharedStatus = getSharedStatus(selectedLink);
    const hasSharedLink = !!selectedLink.shareUrl;
    const iconName = sharedStatus === 'shared' ? 'users' : 'user-plus';
    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;

    return (
        <>
            <ButtonComp
                title={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
                onClick={() => onClick()}
                data-testid={hasSharedLink ? 'toolbar-manage-link' : 'toolbar-share-link'}
                className="inline-flex flex-nowrap flex-row items-center"
            >
                <Icon name={iconName} className={clsx(!showIconOnly && 'mr-2')} />
                <span className={clsx(showIconOnly && 'sr-only')}>
                    {hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Share`}
                </span>
            </ButtonComp>
        </>
    );
};

export default PhotosShareLinkButton;
