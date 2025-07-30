import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useFolderUploadInput } from '../../../store';

export const UploadFolderButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: handleUploadFolder,
        handleChange,
    } = useFolderUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ToolbarButton
                data-testid="toolbar-upload-folder"
                icon={<Icon name="folder-arrow-up" alt={c('Action').t`Upload folder`} />}
                title={c('Action').t`Upload folder`}
                onClick={handleUploadFolder}
            />
        </>
    );
};
