import { c } from 'ttag';

import drivePhotosMigration from '@proton/styles/assets/img/drive/drive-photos-migration.svg';

export const PhotosMigrationView = () => (
    <div className="m-auto flex flex-column items-center justify-center gap-2 text-center">
        <img
            src={drivePhotosMigration}
            className="px-3 max-w-custom"
            style={{
                '--max-w-custom': '21rem',
            }}
            alt=""
        />
        <h3 className="text-bold text-xxl">{c('Title').t`Setting up Albums & Filters`}</h3>
        <p className="text-lg m-0 flex flex-column items-center">
            <span>{c('Info').t`If you have a large photo library, it might take some time.`}</span>
            <span>{c('Info').t`You can close the tab. We'll work on it in the background.`}</span>
        </p>
    </div>
);
