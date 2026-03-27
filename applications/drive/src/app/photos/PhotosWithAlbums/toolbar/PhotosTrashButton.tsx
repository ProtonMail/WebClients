import { c } from 'ttag';

import { DropdownMenuButton, ToolbarButton } from '@proton/components';
import { generateNodeUid, getDriveForPhotos } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import clsx from '@proton/utils/clsx';

import { useTrashActions } from '../../../sections/commonActions/useTrashActions';
import type { LinkInfo } from '../../../store';

interface Props {
    selectedLinks: LinkInfo[];
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

const PhotosTrashButton = ({ selectedLinks, showIconOnly, dropDownMenuButton }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashItems } = useTrashActions();
    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;
    return (
        <ButtonComp
            disabled={isLoading}
            title={c('Action').t`Delete`}
            onClick={() =>
                withLoading(
                    trashItems(
                        getDriveForPhotos(),
                        selectedLinks.map((link) => ({
                            uid: generateNodeUid(link.volumeId, link.linkId),
                            parentUid: link.parentLinkId
                                ? generateNodeUid(link.volumeId, link.parentLinkId)
                                : undefined,
                            name: link.name,
                        }))
                    )
                )
            }
            data-testid="toolbar-trash"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <IcTrash className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Delete`}</span>
        </ButtonComp>
    );
};

export default PhotosTrashButton;
