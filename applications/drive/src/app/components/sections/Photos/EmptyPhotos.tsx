import { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { DRIVE_ANDROID_APP } from '@proton/shared/lib/drive/urls';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import emptyPhotosSvg from '@proton/styles/assets/img/illustrations/empty-photos.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';
import clsx from '@proton/utils/clsx';

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
                <div className="relative">
                    <div className="absolute left-0 right-0 top-custom" style={{ '--top-custom': '-15px' }}>
                        <span className={clsx('bg-weak color-primary px-2 py-0.5 rounded-full text-semibold')}>{c(
                            'Info'
                        ).t`Coming soon`}</span>
                    </div>
                    <img
                        className="opacity-30"
                        width="140"
                        src={appStoreSvg}
                        alt={c('Info').t`${DRIVE_APP_NAME} on App Store`}
                    />
                </div>
            </div>
        </DriveEmptyView>
    );
};

export default EmptyPhotos;
