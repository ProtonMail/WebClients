import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon } from '@proton/components/index';

import { useFolderUploadInput } from '../../../store';

interface UploadFolderButtonProps {
    token: string;
    linkId: string;
}
export const UploadFolderButton = ({ token, linkId }: UploadFolderButtonProps) => {
    const { inputRef: fileInput, handleClick: handleUploadFolder, handleChange } = useFolderUploadInput(token, linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <Button
                onClick={handleUploadFolder}
                className="flex flex-column py-3 w-custom"
                style={{
                    '--w-custom': '8.25rem',
                }}
                size="medium"
            >
                <Icon name="folder-arrow-up" size={4} className="mb-4" />
                {c('Action').t`Upload folder`}
            </Button>
        </>
    );
};
