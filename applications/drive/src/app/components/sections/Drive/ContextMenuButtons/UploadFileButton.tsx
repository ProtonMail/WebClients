import { c } from 'ttag';

import { ContextMenuButton } from '../../ContextMenu';
import useFileUploadInput from '../../../uploads/useUploadInput';

interface Props {
    close: () => void;
}

const UploadFileButton = ({ close }: Props) => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput();

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
