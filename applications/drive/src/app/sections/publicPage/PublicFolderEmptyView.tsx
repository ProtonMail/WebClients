import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';
import emptySvg from '@proton/styles/assets/img/illustrations/empty-my-files.svg';
import clsx from '@proton/utils/clsx';

import { DriveEmptyView } from '../../legacy/components/layout/DriveEmptyView';

interface PublicFolderEmptyViewProps {
    onUploadFile: () => void;
    onUploadFolder: () => void;
    uploadEnabled: boolean;
}

export const PublicFolderEmptyView = ({ onUploadFile, onUploadFolder, uploadEnabled }: PublicFolderEmptyViewProps) => {
    return (
        <div className={clsx('mb-5 h-full', uploadEnabled && 'border-2 border-dashed rounded border-norm')}>
            <DriveEmptyView
                image={emptySvg}
                title={c('Info').t`This folder is empty`}
                subtitle={uploadEnabled && c('Info').t`Drop files here to upload or click on the upload button`}
                data-testid="shared-folder-empty-placeholder"
            >
                {uploadEnabled && (
                    <div className="flex gap-3 justify-center">
                        <Button className="flex items-center" onClick={onUploadFolder} size="medium">
                            <IcFolderArrowUp className="mr-2" size={4} />
                            {c('Action').t`Upload folder`}
                        </Button>
                        <Button className="flex items-center" onClick={onUploadFile} size="medium">
                            <IcFileArrowInUp className="mr-2" size={4} />
                            {c('Action').t`Upload files`}
                        </Button>
                    </div>
                )}
            </DriveEmptyView>
        </div>
    );
};
