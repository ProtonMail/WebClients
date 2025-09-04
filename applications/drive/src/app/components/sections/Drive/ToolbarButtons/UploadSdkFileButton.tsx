import { c } from 'ttag';

//TODO: remove this file if we dont want to do this on the legacy app

import { Icon, ToolbarButton } from '@proton/components';

import { useActiveShare } from '../../../../hooks/drive/useActiveShare';
import { useSdkFileUploadInput } from '../../../../hooks/drive/useSdkUploadInput';

const UploadSdkFileButton = () => {
    const { activeFolder } = useActiveShare();
    const { inputRef: fileInput, handleClick, handleChange } = useSdkFileUploadInput(activeFolder.volumeId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ToolbarButton
                data-testid="toolbar-upload-file"
                icon={<Icon name="file-arrow-in-up" alt={c('Action').t`Upload SDK file`} color="green" />}
                title={c('Action').t`Upload file via SDK`}
                onClick={handleClick}
            />
        </>
    );
};

export default UploadSdkFileButton;
