import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { Icon } from '@proton/components/index';

import { useFileUploadInput } from '../../../store';

interface Props {
    token: string;
    linkId: string;
}
export const UploadFileButton = ({ token, linkId }: Props) => {
    const { inputRef: fileInput, handleClick, handleChange } = useFileUploadInput(token, linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <Button
                onClick={handleClick}
                className="flex flex-column py-3 border-dashed w-custom"
                style={{
                    '--w-custom': '8.25rem',
                }}
                size="medium"
            >
                <Icon name="arrow-up-line" size={4} className="mb-4" />
                {c('Action').t`Upload`}
            </Button>
        </>
    );
};
