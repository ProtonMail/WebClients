import { c } from 'ttag';

import { Icon, SidebarPrimaryButton } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../../store';

const EmptyFolderUploadButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <SidebarPrimaryButton className="w13e" onClick={handleClick}>
                <Icon name="arrow-up-line" className="mr0-5" />
                {c('Action').t`Upload files`}
            </SidebarPrimaryButton>
        </>
    );
};

export default EmptyFolderUploadButton;
