import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';

import { useActiveShare } from '../../../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../../../store';

const UploadFileButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange,
    } = useFileUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ToolbarButton
                data-testid="toolbar-upload-file"
                icon={<IcFileArrowInUp alt={c('Action').t`Upload file`} />}
                title={c('Action').t`Upload file`}
                onClick={handleClick}
            />
        </>
    );
};

export default UploadFileButton;
