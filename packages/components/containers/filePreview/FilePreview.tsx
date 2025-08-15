import type { ReactNode, Ref } from 'react';
import { Suspense, forwardRef, lazy, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useBeforeUnload from '@proton/components/hooks/useBeforeUnload';
import { useCombinedRefs, useLoading } from '@proton/hooks';
import busy from '@proton/shared/lib/busy';
import { isMinimumSafariVersion, isMobile, isSafari, isWebglSupported } from '@proton/shared/lib/helpers/browser';
import {
    isAudio,
    isCompatibleCBZ,
    isCompatibleSTL,
    isIWAD,
    isPDF,
    isProtonDocsDocument,
    isSupportedImage,
    isSupportedText,
    isVideo,
    isWordDocument,
} from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable, isPreviewTooLarge } from '@proton/shared/lib/helpers/preview';

import { useHotkeys } from '../../hooks/useHotkeys';
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
import VideoStreamingPreview from './VideoStreamingPreview';

// Lazy Loaded since it includes jszip and it's a rare file type (not common)
const ComicBookPreview = lazy(() => import(/* webpackChunkName: "comic-book-preview" */ './ComicBookPreview'));
const IWADPreview = lazy(() => import(/* webpackChunkName: "iwad-preview" */ './IWADPreview'));

// Lazy Loaded since it includes three.js and it's a rare file type (not common)
const STLPreview = lazy(() => import(/* webpackChunkName: "stl-preview" */ './3DPreview/STLPreview'));

interface FilePreviewProps {
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

    // For Video Streaming
    videoStreaming?: {
        url: string;
        onVideoPlaybackError?: (error?: unknown) => void;
    };

    contents?: Uint8Array<ArrayBuffer>[];
    sharedStatus?: SharedStatus;

    onClose?: () => void;
    onDownload?: () => void;
    onSave?: (content: Uint8Array<ArrayBuffer>[]) => Promise<void>;
    onDetails?: () => void;
    onShare?: () => void;
    onRestore?: () => void; // revision's specific
    onOpenInDocs?: () => void;
    onSelectCover?: () => void; // photos inside albums only
    onFavorite?: () => void; // photos only
    isFavorite?: boolean; // photos only
    date?: Date | string | number;

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
    isSharedFile,
    isPublicDocsAvailable,

    videoStreaming,

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
    isSharedFile?: boolean;
    isPublicDocsAvailable?: boolean;

    // For Video Streaming
    videoStreaming?: {
        url: string;
        onVideoPlaybackError?: (error?: unknown) => void;
    };

    contents?: Uint8Array<ArrayBuffer>[];

    onDownload?: () => void;
    onNewContents?: (content: Uint8Array<ArrayBuffer>[]) => void;
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

        if (mimeType && isVideo(mimeType) && videoStreaming) {
            return (
                <VideoStreamingPreview
                    isLoading={isLoading}
                    isSharedFile={isSharedFile}
                    videoStreaming={videoStreaming}
                    imgThumbnailUrl={imgThumbnailUrl}
                />
            );
        }

        if (mimeType && isProtonDocsDocument(mimeType)) {
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

        // IWAD (.wad) formats
        // if IWAD is disabled by feature flag, `contents` will be undefined and no preview will be shown
        // Disabled on Mobile and only available on Drive
        if (!isMobile() && window.location.hostname.includes('drive') && contents && mimeType && isIWAD(mimeType)) {
            return (
                <Suspense fallback={<PreviewLoader />}>
                    <IWADPreview contents={contents} filename={fileName} />
                </Suspense>
            );
        }
        if (contents && mimeType && fileName && isCompatibleSTL(mimeType, fileName) && isWebglSupported()) {
            return (
                <Suspense fallback={<PreviewLoader />}>
                    <STLPreview stlFile={contents} />
                </Suspense>
            );
        }

        // Certain comic books are actually mimetype 'application/x-cbr' yet extension is .cbz
        // We can only unzip .cbz extension (cbr is rar and proprietary)
        if (contents && mimeType && fileName && isCompatibleCBZ(mimeType, fileName)) {
            return (
                <Suspense fallback={<PreviewLoader />}>
                    <ComicBookPreview
                        contents={contents}
                        mimeType={mimeType}
                        isPublic={typeof isPublic !== 'undefined' ? isPublic : true}
                    />
                </Suspense>
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
            return (
                <VideoPreview
                    contents={contents}
                    mimeType={mimeType}
                    isSharedFile={isSharedFile}
                    onDownload={onDownload}
                />
            );
        }
        if (isAudio(mimeType)) {
            return <AudioPreview contents={contents} mimeType={mimeType} onDownload={onDownload} />;
        }
        if (isSupportedText(mimeType)) {
            return <TextPreview contents={contents} onNewContents={onNewContents} />;
        }
        if (isPDF(mimeType) && contents) {
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

        videoStreaming,

        contents,
        navigationControls,
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
        onSelectCover,
        onFavorite,
        isFavorite,
        date,
    }: FilePreviewProps,
    ref: Ref<HTMLDivElement>
) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const combinedRefs = useCombinedRefs<HTMLDivElement>(ref, rootRef);
    const focusTrapProps = useFocusTrap({
        rootRef,
    });

    const [isSaving, withSaving] = useLoading(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [newContent, setNewContent] = useState<Uint8Array<ArrayBuffer>[]>([]);

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
        <div className="file-preview" ref={combinedRefs} data-testid="file-preview" {...focusTrapProps}>
            <Header
                mimeType={mimeType}
                name={fileName}
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
                onSelectCover={onSelectCover}
                onFavorite={onFavorite}
                isFavorite={isFavorite}
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
                videoStreaming={videoStreaming}
                isPublic={isPublic}
                isPublicDocsAvailable={isPublicDocsAvailable}
                onOpenInDocs={onOpenInDocs}
                contents={contents}
                onDownload={onDownload}
                onNewContents={
                    onSave
                        ? (content: Uint8Array<ArrayBuffer>[]) => {
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
