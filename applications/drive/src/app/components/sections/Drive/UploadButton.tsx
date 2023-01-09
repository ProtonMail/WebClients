import { ReactNode } from 'react';

import { c } from 'ttag';

import { SidebarPrimaryButton } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../../store';

interface Props {
    className?: string;
    disabled?: boolean;
    children?: ReactNode;
}

export const UploadButton = ({ className, disabled, children = c('Action').t`New upload` }: Props) => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <SidebarPrimaryButton disabled={disabled} className={className} onClick={handleClick}>
                {children}
            </SidebarPrimaryButton>
        </>
    );
};

export default UploadButton;
