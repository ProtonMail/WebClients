import { c } from 'ttag';

import { DropdownMenuButton, ToolbarButton } from '@proton/components';
import { getDriveForPhotos } from '@proton/drive/index';
import { useLoading } from '@proton/hooks';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import clsx from '@proton/utils/clsx';

import { useTrashActions } from '../../../sections/commonActions/useTrashActions';
import { getNodeName, getNodeNameFallback } from '../../../utils/sdk/getNodeName';
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

    const handleTrash = async () => {
        const drive = getDriveForPhotos();
        const itemsMap: Record<string, { uid: string; parentUid: string | undefined; name: string }> = {};

        for (const photo of selectedPhotos) {
            if (photo.additionalInfo) {
                itemsMap[photo.nodeUid] = {
                    uid: photo.nodeUid,
                    parentUid: photo.additionalInfo.parentNodeUid,
                    name: photo.additionalInfo.name,
                };
            } else {
                itemsMap[photo.nodeUid] = { uid: photo.nodeUid, parentUid: undefined, name: getNodeNameFallback() };
            }
        }

        const missingUids = selectedPhotos.filter((p) => !p.additionalInfo).map((p) => p.nodeUid);
        if (missingUids.length > 0) {
            for await (const maybeNode of drive.iterateNodes(missingUids)) {
                if (maybeNode.ok) {
                    const uid = maybeNode.value.uid;
                    itemsMap[uid] = { uid, parentUid: undefined, name: getNodeName(maybeNode) };
                }
            }
        }

        return trashItems(drive, Object.values(itemsMap));
    };

    return (
        <ButtonComp
            disabled={isLoading}
            title={c('Action').t`Delete`}
            onClick={() => withLoading(handleTrash())}
            data-testid="toolbar-trash"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <IcTrash className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Delete`}</span>
        </ButtonComp>
    );
};

export default PhotosTrashButton;
