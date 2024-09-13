import type { ReactNode, Ref } from 'react';
import { forwardRef, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useCombinedRefs } from '@proton/hooks';
import { useLoading } from '@proton/hooks';
import busy from '@proton/shared/lib/busy';
import { isMinimumSafariVersion, isSafari } from '@proton/shared/lib/helpers/browser';
import {
    isAudio,
    isPDF,
    isProtonDocument,
    isSupportedImage,
    isSupportedText,
    isVideo,
    isWordDocument,
} from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable, isPreviewTooLarge } from '@proton/shared/lib/helpers/preview';

import { useFocusTrap, useModalState } from '../../components';
import { useBeforeUnload, useHotkeys } from '../../hooks';
import AudioPreview from './AudioPreview';
import CloseModal from './CloseModal';
import type { SharedStatus } from './Header';
import Header from './Header';
import ImagePreview from './ImagePreview';
import PDFPreview from './PDFPreview';
import PreviewError from './PreviewError';
import PreviewLoader from './PreviewLoader';
import { ProtonDocsPreview } from './ProtonDocsPreview';
import SandboxedPreview from './SandboxedPreview';
import SignatureIssue from './SignatureIssue';
import TextPreview from './TextPreview';
import UnsupportedPreview from './UnsupportedPreview';
import VideoPreview from './VideoPreview';

interface Props {
    isMetaLoading?: boolean;
    isLoading: boolean;
    error?: string;
    mimeType?: string;
    imgThumbnailUrl?: string;
    fileName?: string;
    fileSize?: number;

    /** Whether or not we are in a public Drive URL context. */
    isPublic?: boolean;
    /** Feature flag for public Docs */
    isPublicDocsAvailable?: boolean;

    contents?: Uint8Array[];
    isSharingInviteAvailable?: boolean; // Feature flag for drive direct sharing
    sharedStatus?: SharedStatus;

    onClose?: () => void;
    onDownload?: () => void;
    onSave?: (content: Uint8Array[]) => Promise<void>;
    onDetails?: () => void;
    onShare?: () => void;
    onRestore?: () => void; // revision's specific
    onOpenInDocs?: () => void;
    date?: Date | string | number;

    colorUi?: 'standard' | 'prominent';

    navigationControls?: ReactNode;
    signatureStatus?: ReactNode;
    signatureConfirmation?: ReactNode;
}

export const FilePreviewContent = ({
    isMetaLoading,
    isLoading,
    mimeType,
    error,
    imgThumbnailUrl,
    fileSize,
    fileName,
    isPublic,
    isPublicDocsAvailable,

    contents,

    onDownload,
    onNewContents,
    onOpenInDocs,

    signatureConfirmation,

    previewParams,
}: {
    isMetaLoading?: boolean;
    isLoading: boolean;
    mimeType?: string;
    error?: string;
    imgThumbnailUrl?: string;
    fileName?: string;
    fileSize?: number;
    isPublic?: boolean;
    isPublicDocsAvailable?: boolean;

    contents?: Uint8Array[];

    onDownload?: () => void;
    onNewContents?: (content: Uint8Array[]) => void;
    onOpenInDocs?: () => void;

    signatureConfirmation?: ReactNode;

    previewParams?: {
        img?: { zoomControls?: boolean };
    };
}) => {
    const [forcePreview, setForcePreview] = useState(false);
    const renderPreview = () => {
        if (error) {
            return <PreviewError error={error} />;
        }

        if ((mimeType && !isSupportedImage(mimeType) && isLoading) || (!imgThumbnailUrl && isLoading)) {
            return <PreviewLoader />;
        }

        if (signatureConfirmation && !forcePreview) {
            return (
                <SignatureIssue signatureConfirmation={signatureConfirmation} onClick={() => setForcePreview(true)} />
            );
        }

        if (mimeType && isProtonDocument(mimeType)) {
            return (
                <div className="file-preview-container">
                    <ProtonDocsPreview
                        isPublic={isPublic}
                        isPublicDocsAvailable={isPublicDocsAvailable}
                        onOpenInDocs={onOpenInDocs}
                    />
                </div>
            );
        }

        if (
            !mimeType ||
            (!contents && !imgThumbnailUrl && !isSupportedText(mimeType)) ||
            !isPreviewAvailable(mimeType, fileSize)
        ) {
            return (
                <div className="file-preview-container">
                    <UnsupportedPreview onDownload={onDownload} tooLarge={isPreviewTooLarge(mimeType, fileSize)} />
                </div>
            );
        }

        if (isSupportedImage(mimeType)) {
            return (
                <ImagePreview
                    isLoading={isLoading}
                    isZoomEnabled={previewParams?.img?.zoomControls}
                    placeholderSrc={imgThumbnailUrl}
                    fileName={fileName}
                    contents={contents}
                    mimeType={mimeType}
                    onDownload={onDownload}
                />
            );
        }
        if (isVideo(mimeType)) {
            return <VideoPreview contents={contents} mimeType={mimeType} onDownload={onDownload} />;
        }
        if (isAudio(mimeType)) {
            return <AudioPreview contents={contents} mimeType={mimeType} onDownload={onDownload} />;
        }
        if (isSupportedText(mimeType)) {
            return <TextPreview contents={contents} onNewContents={onNewContents} />;
        }
        if (isPDF(mimeType)) {
            return <PDFPreview contents={contents} filename={fileName} />;
        }
        if (isWordDocument(mimeType)) {
            if (isSafari() && !isMinimumSafariVersion(16)) {
                return (
                    <div className="file-preview-container">
                        <UnsupportedPreview onDownload={onDownload} browser />
                    </div>
                );
            }
            return <SandboxedPreview contents={contents} mimeType={mimeType} onDownload={onDownload} />;
        }
    };

    return <>{isMetaLoading ? <PreviewLoader /> : renderPreview()}</>;
};

const FilePreview = (
    {
        isMetaLoading = false,
        isLoading = false,
        error,
        fileName,
        mimeType,
        imgThumbnailUrl,
        fileSize,
        isPublic,

        contents,
        navigationControls,
        isSharingInviteAvailable,
        isPublicDocsAvailable,
        sharedStatus,
        signatureStatus,
        signatureConfirmation,
        onClose,
        onDownload,
        onSave,
        onDetails,
        onShare,
        onRestore,
        onOpenInDocs,
        date,

        colorUi = 'prominent',
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const combinedRefs = useCombinedRefs<HTMLDivElement>(ref, rootRef);
    const focusTrapProps = useFocusTrap({
        rootRef,
    });

    const [isSaving, withSaving] = useLoading(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [newContent, setNewContent] = useState<Uint8Array[]>([]);

    // Block browser from leaving and do not refresh page with unsaved document.
    useBeforeUnload(isDirty);
    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const unregister = busy.register();
        return () => {
            unregister();
        };
    }, [isDirty]);

    // Reset when another content is loaded (for example after going to the next item through navigation).
    useEffect(() => {
        setIsDirty(false);
    }, [contents]);

    const [closeModalProps, setCloseModalOpen] = useModalState();
    const handleClose = () => {
        if (!isDirty) {
            onClose?.();
            return;
        }

        setCloseModalOpen(true);
    };

    // There is an issue saving empty file at this moment. Lets not allow it for now.
    const handleSave = onSave
        ? async () => {
              return withSaving(onSave(newContent)).then(() => {
                  // Compare to latest changes and unset dirty flag only if the user
                  // didn't do any extra modifications after saving the file.
                  setNewContent((latestNewContent) => {
                      if (latestNewContent === newContent) {
                          setIsDirty(false);
                          setCloseModalOpen(false);
                      }
                      return latestNewContent;
                  });
              });
          }
        : undefined;

    useHotkeys(rootRef, [
        [
            'Escape',
            (e) => {
                e.stopPropagation();
                handleClose();
            },
        ],
    ]);

    return (
        <div className={`file-preview ui-${colorUi}`} ref={combinedRefs} data-testid="file-preview" {...focusTrapProps}>
            <Header
                mimeType={mimeType}
                name={fileName}
                isSharingInviteAvailable={isSharingInviteAvailable}
                sharedStatus={sharedStatus}
                signatureStatus={signatureStatus}
                isDirty={
                    isDirty &&
                    // There is an issue saving empty file at this moment. Lets not allow it for now.
                    newContent.some((item) => item.length > 0)
                }
                onClose={handleClose}
                onDownload={onDownload}
                onSave={handleSave}
                onDetails={onDetails}
                onShare={onShare}
                onRestore={onRestore}
                onOpenInDocs={onOpenInDocs}
                date={date}
            >
                {isDirty ? <div className="flex items-center">{c('Info').t`Unsaved changes`}</div> : navigationControls}
            </Header>
            <FilePreviewContent
                isMetaLoading={isMetaLoading}
                isLoading={isLoading}
                mimeType={mimeType}
                error={error}
                imgThumbnailUrl={imgThumbnailUrl}
                fileSize={fileSize}
                fileName={fileName}
                isPublic={isPublic}
                isPublicDocsAvailable={isPublicDocsAvailable}
                onOpenInDocs={onOpenInDocs}
                contents={contents}
                onDownload={onDownload}
                onNewContents={
                    onSave
                        ? (content: Uint8Array[]) => {
                              setIsDirty(true);
                              setNewContent(content);
                          }
                        : undefined
                }
                signatureConfirmation={signatureConfirmation}
            />
            <CloseModal {...closeModalProps} handleDiscard={onClose} isSaving={isSaving} />
        </div>
    );
};
export default forwardRef(FilePreview);
