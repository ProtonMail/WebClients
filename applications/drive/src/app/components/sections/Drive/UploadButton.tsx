import { c } from 'ttag';

import { classnames, FloatingButton, Icon, SidebarPrimaryButton } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useDownload, useFileUploadInput, useUpload } from '../../../store';

export const UploadButton = ({ className }: { className?: string }) => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <SidebarPrimaryButton className={className} onClick={handleClick}>{c('Action')
                .t`New upload`}</SidebarPrimaryButton>
        </>
    );
};

const UploadMobileButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    const { downloads } = useDownload();
    const { hasUploads } = useUpload();
    const isTransferring = hasUploads || downloads.length > 0;

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <FloatingButton
                className={classnames([isTransferring && 'fab--is-higher'])}
                onClick={handleClick}
                title={c('Action').t`New upload`}
            >
                <Icon size={24} name="plus" className="mauto" />
            </FloatingButton>
        </>
    );
};

const UploadSidebarButton = ({ mobileVersion = false }: { mobileVersion?: boolean }) => {
    if (mobileVersion) {
        return <UploadMobileButton />;
    }
    return <UploadButton className="no-mobile" />;
};
export default UploadSidebarButton;
