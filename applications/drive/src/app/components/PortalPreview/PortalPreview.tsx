import { c } from 'ttag';

import { ModalStateProps, useModalTwo } from '@proton/components/components';
import { Portal } from '@proton/components/components/portal';
import { FilePreview } from '@proton/components/containers';

import { useFileView } from '../../store';

interface Props {
    shareId: string;
    linkId: string;
    revisionId: string;
    date: Date | string | number;
    onDetails?: () => void;
    onRestore?: () => void;
    className?: string;
}
const PortalPreview = ({
    shareId,
    linkId,
    revisionId,
    onDetails,
    onRestore,
    date,
    className,
    ...modalProps
}: Props & ModalStateProps) => {
    const { contents, link, error, isLinkLoading, isContentLoading, downloadFile } = useFileView(
        shareId,
        linkId,
        false,
        revisionId
    );
    if (!modalProps.open) {
        return null;
    }
    return (
        <Portal>
            <div className={className}>
                <FilePreview
                    isMetaLoading={isLinkLoading}
                    isLoading={isContentLoading}
                    error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
                    fileName={link?.name}
                    mimeType={link?.mimeType}
                    fileSize={link?.size}
                    contents={contents}
                    onClose={() => {
                        modalProps.onClose();
                        modalProps.onExit();
                    }}
                    onDownload={downloadFile}
                    onDetails={onDetails}
                    onRestore={onRestore}
                    date={date}
                />
            </div>
        </Portal>
    );
};

export default PortalPreview;

export const usePortalPreview = () => {
    return useModalTwo<Props, void>(PortalPreview, false);
};
