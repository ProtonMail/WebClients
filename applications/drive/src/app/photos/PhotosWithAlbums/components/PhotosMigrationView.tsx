import { c } from 'ttag';

import drivePhotosMigration from '@proton/styles/assets/img/drive/drive-photos-migration.svg';

export const PhotosMigrationView = () => (
    <div
        className="m-auto flex flex-column items-center justify-center gap-2 max-w-custom text-center"
        style={{
            '--max-w-custom': '21rem',
        }}
    >
        <img src={drivePhotosMigration} className="px-3" alt="" />
        <h3 className="text-bold text-xxl">{c('Title').t`Upgrading your Photos experience`}</h3>
        <h4 className="text-lg">{c('Info').t`Setting up Albums & Filters. This might take a few minutes.`}</h4>
    </div>
);
