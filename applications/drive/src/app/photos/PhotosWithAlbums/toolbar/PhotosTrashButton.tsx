import { c } from 'ttag';

import { DropdownMenuButton, ToolbarButton } from '@proton/components';
import { getDriveForPhotos } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import clsx from '@proton/utils/clsx';

import { useTrashActions } from '../../../sections/commonActions/useTrashActions';
import { getNodeNameFallback } from '../../../utils/sdk/getNodeName';
import type { PhotoItem } from '../../usePhotos.store';

interface Props {
    selectedPhotos: PhotoItem[];
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

const PhotosTrashButton = ({ selectedPhotos, showIconOnly, dropDownMenuButton }: Props) => {
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
                        selectedPhotos.map((photo) => ({
                            uid: photo.nodeUid,
                            parentUid: photo.additionalInfo?.parentNodeUid,
                            name: photo.additionalInfo?.name ?? getNodeNameFallback(),
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
