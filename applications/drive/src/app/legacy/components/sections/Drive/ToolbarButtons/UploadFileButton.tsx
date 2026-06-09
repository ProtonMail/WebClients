import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { generateNodeUid } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';

import { useActiveShare } from '../../../../../legacy/hooks/drive/useActiveShare';
import { useUploadInput } from '../../../../../legacy/hooks/drive/useUploadInput';

const UploadFileButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange,
    } = useUploadInput({
        onUpload: (files) => uploadManager.upload(files, generateNodeUid(activeFolder.volumeId, activeFolder.linkId)),
    });

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
