import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { generateNodeUid } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';
import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';

import { useActiveShare } from '../../../../../legacy/hooks/drive/useActiveShare';
import { useUploadInput } from '../../../../../legacy/hooks/drive/useUploadInput';

const UploadFolderButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: handleUploadFolder,
        handleChange,
    } = useUploadInput({
        onUpload: (files) => uploadManager.upload(files, generateNodeUid(activeFolder.volumeId, activeFolder.linkId)),
        forFolders: true,
    });

    return (
        <>
            <input type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ToolbarButton
                data-testid="toolbar-upload-folder"
                icon={<IcFolderArrowUp alt={c('Action').t`Upload folder`} />}
                title={c('Action').t`Upload folder`}
                onClick={handleUploadFolder}
            />
        </>
    );
};

export default UploadFolderButton;
