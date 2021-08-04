import { c } from 'ttag';

import { classnames, FloatingButton, Icon, SidebarPrimaryButton } from '@proton/components';

import { useDriveActiveFolder } from '../Drive/DriveFolderProvider';
import useFileUploadInput from '../../hooks/drive/useFileUploadInput';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { useUploadProvider } from './UploadProvider';

interface Props {
    floating?: boolean;
    className?: string;
}

const UploadButton = ({ floating, className }: Props) => {
    const { folder } = useDriveActiveFolder();
    const { inputRef: fileInput, handleClick, handleChange: handleFileChange } = useFileUploadInput();

    const { downloads } = useDownloadProvider();
    const { uploads } = useUploadProvider();
    const isTransferring = uploads.length > 0 || downloads.length > 0;

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            {floating ? (
                <FloatingButton
                    className={classnames([isTransferring && 'fab--is-higher'])}
                    disabled={!folder?.shareId}
                    onClick={handleClick}
                    title={c('Action').t`New upload`}
                >
                    <Icon size={24} name="plus" className="mauto" />
                </FloatingButton>
            ) : (
                <SidebarPrimaryButton className={className} disabled={!folder?.shareId} onClick={handleClick}>{c(
                    'Action'
                ).t`New upload`}</SidebarPrimaryButton>
            )}
        </>
    );
};
export default UploadButton;
