import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, Toolbar } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';

import { PhotosUploadButton } from './PhotosUploadButton';

export interface PhotosAddAlbumPhotosToolbarProps {
    selectedCount: number;
    onAddAlbumPhotos: () => Promise<void>;
    onUploadStart?: () => void;
    albumNodeUid?: string;
}

export const PhotosAddAlbumPhotosToolbar = ({
    selectedCount,
    onAddAlbumPhotos,
    onUploadStart,
    albumNodeUid,
}: PhotosAddAlbumPhotosToolbarProps) => {
    const [isLoading, withLoading] = useLoading();
    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container toolbar--no-bg">
            <div className="gap-2 flex items-center">
                <PhotosUploadButton
                    type="toolbar"
                    onUploadStart={onUploadStart}
                    albumNodeUid={albumNodeUid}
                    label={c('Action').t`Upload from computer`}
                />
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
