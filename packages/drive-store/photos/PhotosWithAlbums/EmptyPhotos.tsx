import type { FC } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { Icon } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { PHOTOS_ACCEPTED_INPUT } from '@proton/shared/lib/drive/constants';
import { DRIVE_ANDROID_APP, DRIVE_IOS_APP } from '@proton/shared/lib/drive/urls';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import emptyPhotosSvg from '@proton/styles/assets/img/illustrations/empty-photos.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';

import { DriveEmptyView } from '../../components/layout/DriveEmptyView';
import { useFileUploadInput } from '../../store';

interface EmptyPhotosProps {
    shareId: string;
    linkId: string;
}

export const EmptyPhotos: FC<EmptyPhotosProps> = ({ shareId, linkId }) => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput(shareId, linkId, true);

    return (
        <DriveEmptyView
            image={emptyPhotosSvg}
            title={
                // translator: Shown as a call to action when there are no photos synced
                c('Info').t`Ready to add some photos?`
            }
            subtitle={
                // translator: Shown as a call to action when there are no photos synced
                c('Info').t`Get the app to backup photos from your phone or upload them here.`
            }
        >
            <div
                className="w-custom mx-auto"
                style={{
                    '--w-custom': 'max-content',
                }}
            >
                <div
                    className="mt-10 mb-4 flex items-center justify-center gap-5"
                    data-testid="photos-empty-page:mobile-apps"
                >
                    <Href href={DRIVE_ANDROID_APP}>
                        <img width="140" src={playStoreSvg} alt={c('Info').t`${DRIVE_APP_NAME} on Play Store`} />
                    </Href>
                    <Href href={DRIVE_IOS_APP}>
                        <img width="140" src={appStoreSvg} alt={c('Info').t`${DRIVE_APP_NAME} on App Store`} />
                    </Href>
                </div>
                <input
                    multiple
                    type="file"
                    ref={fileInput}
                    className="hidden"
                    onChange={handleChange}
                    accept={PHOTOS_ACCEPTED_INPUT}
                />
                <Button
                    className="w-full"
                    color="norm"
                    onClick={handleClick}
                    data-testid="main-photos-upload"
                    title={c('Action').t`Upload photos`}
                >
                    <Icon className="mr-2" name="arrow-up-line" alt={c('Action').t`Upload photos`} />
                    {c('Actions').t`Upload`}
                </Button>
            </div>
        </DriveEmptyView>
    );
};
