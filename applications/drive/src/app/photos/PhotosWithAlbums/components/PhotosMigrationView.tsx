import { c } from 'ttag';

import drivePhotosMigration from '@proton/styles/assets/img/drive/drive-photos-migration.svg';

export const PhotosMigrationView = () => (
    <div
        className="m-auto flex flex-column items-center justify-center gap-2 max-w-custom"
        style={{
            '--max-w-custom': '19.375rem',
        }}
    >
        <img src={drivePhotosMigration} alt="" />
        <h3 className="text-bold text-xxl">{c('Title').t`Updating your photos`}</h3>
        <h4 className="text-lg text-center">{c('Info')
            .t`Please wait while we update your data this may take a few seconds.`}</h4>
    </div>
);
