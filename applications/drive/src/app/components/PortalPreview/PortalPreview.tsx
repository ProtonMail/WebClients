import type { ReactNode, Ref } from 'react';
import { forwardRef, useMemo } from 'react';

import { c } from 'ttag';

import type { ModalStateProps } from '@proton/components';
import { FilePreview } from '@proton/components';
import { Portal } from '@proton/components/components/portal';

import { useFileView } from '../../store';
import { getSharedStatus } from '../../utils/share';
import { SignatureAlertBody } from '../SignatureAlert';
import SignatureIcon from '../SignatureIcon';

interface PortalPreviewProps {
    shareId: string;
    linkId: string;
    revisionId?: string;
    date?: Date | string | number;
    onDetails?: () => void;
    onRestore?: () => void;
    onShare?: () => void;
    onSelectCover?: () => void;
    onFavorite?: () => void;
    isFavorite?: boolean;
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
        onSelectCover,
        onFavorite,
        isFavorite,
        date,
        className,
        navigationControls,
        ...modalProps
    }: PortalPreviewProps & ModalStateProps,
    ref: Ref<HTMLDivElement>
) => {
    const { contents, contentsMimeType, link, error, isLinkLoading, isContentLoading, downloadFile, videoStreaming } =
        useFileView(shareId, linkId, false, revisionId);

    const signatureStatus = useMemo(() => {
        if (!link) {
            return;
        }

        return (
            <SignatureIcon
                isFile={link.isFile}
                mimeType={link.mimeType}
                signatureIssues={link.signatureIssues}
                isAnonymous={link.isAnonymous}
                className="ml-2 color-danger"
                haveParentAccess={!!link.parentLinkId}
            />
        );
    }, [link]);

    const signatureConfirmation = useMemo(() => {
        if (!link?.signatureIssues?.blocks) {
            return;
        }

        return (
            <SignatureAlertBody
                signatureIssues={link.signatureIssues}
                signatureEmail={link.isFile ? link.activeRevision?.signatureEmail : link.signatureEmail}
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
                    sharedStatus={getSharedStatus(link)}
                    fileSize={link?.size}
                    contents={contents}
                    videoStreaming={videoStreaming}
                    onClose={() => {
                        modalProps.onClose();
                        modalProps.onExit();
                    }}
                    ref={ref}
                    onDownload={downloadFile}
                    onDetails={onDetails}
                    onRestore={onRestore}
                    onShare={onShare}
                    onSelectCover={onSelectCover}
                    onFavorite={onFavorite}
                    isFavorite={isFavorite}
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
