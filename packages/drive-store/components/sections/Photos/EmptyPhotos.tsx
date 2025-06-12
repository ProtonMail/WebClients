import type { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_ANDROID_APP, DRIVE_IOS_APP } from '@proton/shared/lib/drive/urls';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import emptyPhotosSvg from '@proton/styles/assets/img/illustrations/empty-photos.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';

import { DriveEmptyView } from '../../layout/DriveEmptyView';

type Props = {};

export const EmptyPhotos: FC<Props> = () => {
    return (
        <DriveEmptyView
            image={emptyPhotosSvg}
            title={
                // translator: Shown as a call to action when there are no photos synced
                c('Info').t`Ready to add some photos?`
            }
            subtitle={
                // translator: Shown as a call to action when there are no photos synced
                c('Info').t`Get the app to backup photos from your phone.`
            }
        >
            <div className="mt-10 flex items-center justify-center gap-4" data-testid="photos-empty-page:mobile-apps">
                <Href href={DRIVE_ANDROID_APP}>
                    <img width="140" src={playStoreSvg} alt={c('Info').t`${DRIVE_APP_NAME} on Play Store`} />
                </Href>
                <Href href={DRIVE_IOS_APP}>
                    <img width="140" src={appStoreSvg} alt={c('Info').t`${DRIVE_APP_NAME} on App Store`} />
                </Href>
            </div>
        </DriveEmptyView>
    );
};
