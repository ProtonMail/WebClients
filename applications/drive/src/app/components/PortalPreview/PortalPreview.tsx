import { ReactNode, Ref, forwardRef, useMemo } from 'react';

import { c } from 'ttag';

import { ModalStateProps } from '@proton/components/components';
import { Portal } from '@proton/components/components/portal';
import { FilePreview } from '@proton/components/containers';

import { useFileView } from '../../store';
import { SignatureAlertBody } from '../SignatureAlert';
import SignatureIcon from '../SignatureIcon';

interface Props {
    shareId: string;
    linkId: string;
    revisionId?: string;
    date?: Date | string | number;
    onDetails?: () => void;
    onRestore?: () => void;
    onShare?: () => void;
    className?: string;
    navigationControls?: ReactNode;
}

const PortalPreview = (
    {
        shareId,
        linkId,
        revisionId,
        onDetails,
        onRestore,
        onShare,
        date,
        className,
        navigationControls,
        ...modalProps
    }: Props & ModalStateProps,
    ref: Ref<HTMLDivElement>
) => {
    const { contents, contentsMimeType, link, error, isLinkLoading, isContentLoading, downloadFile } = useFileView(
        shareId,
        linkId,
        false,
        revisionId
    );

    const signatureStatus = useMemo(() => {
        if (!link) {
            return;
        }

        return (
            <SignatureIcon isFile={link.isFile} signatureIssues={link.signatureIssues} className="ml-2 color-danger" />
        );
    }, [link]);

    const signatureConfirmation = useMemo(() => {
        if (!link?.signatureIssues?.blocks) {
            return;
        }

        return (
            <SignatureAlertBody
                signatureIssues={link.signatureIssues}
                signatureAddress={link.signatureAddress}
                isFile={link.isFile}
                name={link.name}
            />
        );
    }, [link]);

    if (!modalProps.open) {
        return null;
    }

    const showCachedThumbnail = revisionId === link?.activeRevision?.id;

    return (
        <Portal>
            <div className={className}>
                <FilePreview
                    imgThumbnailUrl={showCachedThumbnail ? link?.cachedThumbnailUrl : undefined}
                    isMetaLoading={isLinkLoading}
                    isLoading={isContentLoading}
                    error={error ? error.message || error.toString?.() || c('Info').t`Unknown error` : undefined}
                    fileName={link?.name}
                    mimeType={contentsMimeType}
                    fileSize={link?.size}
                    contents={contents}
                    onClose={() => {
                        modalProps.onClose();
                        modalProps.onExit();
                    }}
                    ref={ref}
                    onDownload={downloadFile}
                    onDetails={onDetails}
                    onRestore={onRestore}
                    onShare={onShare}
                    date={date}
                    navigationControls={navigationControls}
                    signatureStatus={signatureStatus}
                    signatureConfirmation={signatureConfirmation}
                />
            </div>
        </Portal>
    );
};

export default forwardRef(PortalPreview);
