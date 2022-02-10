import { c } from 'ttag';

import useActiveShare from '../../../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    close: () => void;
}

const UploadFileButton = ({ close }: Props) => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <ContextMenuButton
                testId="toolbar-upload-file"
                icon="file-arrow-up"
                name={c('Action').t`Upload file`}
                action={handleClick}
                close={close}
            />
        </>
    );
};

export default UploadFileButton;
