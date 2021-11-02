import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';
import useFileUploadInput from '../../../uploads/useUploadInput';

interface Props {
    close: () => void;
}

const UploadFolderButton = ({ close }: Props) => {
    const { inputRef: fileInput, handleClick: handleUploadFolder, handleChange } = useFileUploadInput(true);

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
