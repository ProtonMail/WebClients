import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateReturnObj } from '@proton/components';
import emptyPhotosSvg from '@proton/styles/assets/img/illustrations/empty-photos.svg';

import { DriveEmptyView } from '../../components/layout/DriveEmptyView';

interface EmptyAlbumsProps {
    createAlbumModal?: ModalStateReturnObj;
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
                c('Info').t`The albums you create are shown here.`
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
                        createAlbumModal?.openModal(true);
                    }}
                    data-testid="empty-create-album"
                    title={c('Action').t`Create album`}
                >
                    {c('Action').t`Create album`}
                </Button>
            </div>
        </DriveEmptyView>
    );
};
