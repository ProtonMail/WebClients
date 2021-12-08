import { c } from 'ttag';

import useActiveShare from '../../../../hooks/drive/useActiveShare';
import { useFolderUploadInput } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    close: () => void;
}

const UploadFolderButton = ({ close }: Props) => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: handleUploadFolder,
        handleChange,
    } = useFolderUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ContextMenuButton
                testId="toolbar-upload-folder"
                icon="folder-arrow-up"
                name={c('Action').t`Upload folder`}
                action={handleUploadFolder}
                close={close}
            />
        </>
    );
};

export default UploadFolderButton;
