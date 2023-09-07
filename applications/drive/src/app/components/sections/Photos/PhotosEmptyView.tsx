import { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { EmptyViewContainer } from '@proton/components';
import { DRIVE_ANDROID_APP, DRIVE_IOS_APP } from '@proton/shared/lib/drive/urls';
import appStoreSvg from '@proton/styles/assets/img/illustrations/app-store.svg';
import emptyPhotosSvg from '@proton/styles/assets/img/illustrations/empty-photos.svg';
import playStoreSvg from '@proton/styles/assets/img/illustrations/play-store.svg';

type Props = {};

export const PhotosEmptyView: FC<Props> = () => {
    return (
        <div role="presentation" className="flex w100 flex-item-fluid">
            <EmptyViewContainer
                imageProps={{ src: emptyPhotosSvg, title: c('Info').t`No photos yet` }}
                data-testid="photos-empty-placeholder"
            >
                <div className="flex flex-column flex-align-items-center flex-justify-center">
                    <h3 className="text-bold">{c('Info').t`No photos yet`}</h3>
                    <p className="text-center w24e max-w100">
                        {c('Info').t`As soon as you have photos or videos on your device, they will appear here.`}
                    </p>
                </div>
                <div className="mt-10 flex flex-align-items-center flex-justify-center gap-4">
                    <Href href={DRIVE_ANDROID_APP}>
                        <img width="140" src={playStoreSvg} alt="Play Store" />
                    </Href>
                    <Href href={DRIVE_IOS_APP}>
                        <img width="140" src={appStoreSvg} alt="App Store" />
                    </Href>
                </div>
            </EmptyViewContainer>
        </div>
    );
};

export default PhotosEmptyView;
