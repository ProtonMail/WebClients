import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon, Toolbar } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';

import { PhotosUploadButton } from './PhotosUploadButton';

export interface PhotosAddAlbumPhotosToolbarProps {
    shareId: string;
    linkId: string;
    selectedCount: number;
    onAddAlbumPhotos: () => Promise<void>;
}

export const PhotosAddAlbumPhotosToolbar = ({
    shareId,
    linkId,
    selectedCount,
    onAddAlbumPhotos,
}: PhotosAddAlbumPhotosToolbarProps) => {
    const [isLoading, withLoading] = useLoading();
    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container toolbar--no-bg">
            <div className="gap-2 flex items-center">
                <PhotosUploadButton shareId={shareId} linkId={linkId} type="toolbar" isAddAlbumPhotosView />
                <Button
                    className="flex items-center"
                    color="norm"
                    shape="solid"
                    loading={isLoading}
                    disabled={selectedCount === 0}
                    onClick={() => withLoading(onAddAlbumPhotos)}
                    data-testid="toolbar-add-to-album"
                >
                    <Icon className="mr-2" name="checkmark" />
                    <span>{c('Action').t`Add to album`}</span>
                </Button>
            </div>
        </Toolbar>
    );
};
