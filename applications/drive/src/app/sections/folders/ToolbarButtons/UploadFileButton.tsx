import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../../store';

export const UploadFileButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ToolbarButton
                data-testid="toolbar-upload-file"
                icon={<Icon name="file-arrow-in-up" alt={c('Action').t`Upload file`} />}
                title={c('Action').t`Upload file`}
                onClick={handleClick}
            />
        </>
    );
};
