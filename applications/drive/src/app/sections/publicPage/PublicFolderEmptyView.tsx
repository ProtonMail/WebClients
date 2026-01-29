import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import emptySvg from '@proton/styles/assets/img/illustrations/empty-my-files.svg';
import clsx from '@proton/utils/clsx';

import { DriveEmptyView } from '../../components/layout/DriveEmptyView';
import { useUploadInput } from '../../hooks/drive/useUploadInput';

interface PublicFolderEmptyViewProps {
    onUpload: (files: FileList) => void;
    uploadEnabled: boolean;
}

export const PublicFolderEmptyView = ({ onUpload, uploadEnabled }: PublicFolderEmptyViewProps) => {
    const {
        inputRef: fileInputRef,
        handleClick: handleClickFileUpload,
        handleChange: handleFileChange,
    } = useUploadInput({
        onUpload,
        forFolders: false,
    });

    const {
        inputRef: folderInputRef,
        handleClick: handleClickFolderUpload,
        handleChange: handleFolderChange,
    } = useUploadInput({
        onUpload,
        forFolders: true,
    });

    return (
        <div className={clsx('mb-5 h-full', uploadEnabled && 'border-2 border-dashed rounded border-norm')}>
            <DriveEmptyView
                image={emptySvg}
                title={c('Info').t`This folder is empty`}
                subtitle={uploadEnabled && c('Info').t`Drop files here to upload or click on the upload button`}
                data-testid="shared-folder-empty-placeholder"
            >
                {uploadEnabled && (
                    <>
                        <input multiple type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        <input
                            multiple
                            type="file"
                            ref={folderInputRef}
                            className="hidden"
                            onChange={handleFolderChange}
                        />
                        <div className="flex gap-3 justify-center">
                            <Button className="flex items-center" onClick={handleClickFolderUpload} size="medium">
                                <Icon className="mr-2" name="folder-arrow-up" size={4} />
                                {c('Action').t`Upload folder`}
                            </Button>
                            <Button className="flex items-center" onClick={handleClickFileUpload} size="medium">
                                <Icon className="mr-2" name="file-arrow-in-up" size={4} />
                                {c('Action').t`Upload files`}
                            </Button>
                        </div>
                    </>
                )}
            </DriveEmptyView>
        </div>
    );
};
