import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, type ModalStateReturnObj } from '@proton/components/index';
import emptyPhotosSvg from '@proton/styles/assets/img/illustrations/empty-photos.svg';

import { DriveEmptyView } from '../../components/layout/DriveEmptyView';

interface EmptyAlbumsProps {
    createAlbumModal: ModalStateReturnObj;
}

export const EmptyAlbums: FC<EmptyAlbumsProps> = ({ createAlbumModal }) => {
    return (
        <DriveEmptyView
            image={emptyPhotosSvg}
            title={
                // translator: Shown as a call to action when there are no photos synced
                c('Info').t`No Albums`
            }
            subtitle={
                // translator: Shown as a call to action when there are no photos synced
                c('Info').t`The albums you create are shown here`
            }
        >
            <div
                className="w-custom mx-auto"
                style={{
                    '--w-custom': 'max-content',
                }}
            >
                <Button
                    className="w-full"
                    color="norm"
                    onClick={() => {
                        createAlbumModal.openModal(true);
                    }}
                    data-testid="empty-create-album"
                    title={c('Action').t`Create album`}
                >
                    <Icon className="mr-2" name="plus" alt={c('Action').t`Create album`} />
                    {c('Actions').t`Create album`}
                </Button>
            </div>
        </DriveEmptyView>
    );
};
