import { c } from 'ttag';

import { classnames, FloatingButton, Icon, SidebarPrimaryButton } from '@proton/components';

import useFileUploadInput from '../../../hooks/drive/useFileUploadInput';
import { useDownloadProvider } from '../../downloads/DownloadProvider';
import { useUploadProvider } from '../../uploads/UploadProvider';

export const UploadButton = ({ className }: { className?: string }) => {
    const { inputRef: fileInput, handleClick, handleChange: handleFileChange } = useFileUploadInput();

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <SidebarPrimaryButton className={className} onClick={handleClick}>{c('Action')
                .t`New upload`}</SidebarPrimaryButton>
        </>
    );
};

const UploadMobileButton = () => {
    const { inputRef: fileInput, handleClick, handleChange: handleFileChange } = useFileUploadInput();

    const { downloads } = useDownloadProvider();
    const { uploads } = useUploadProvider();
    const isTransferring = uploads.length > 0 || downloads.length > 0;

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
