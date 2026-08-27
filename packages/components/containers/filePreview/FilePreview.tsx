import type { ReactNode, Ref } from 'react';
import { Suspense, forwardRef, lazy, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useCombinedRefs, useLoading } from '@proton/hooks';
import busy from '@proton/shared/lib/busy';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { isMinimumSafariVersion, isMobile, isSafari, isWebglSupported } from '@proton/shared/lib/helpers/browser';
import {
    isAudio,
    isCompatibleCBZ,
    isCompatibleSTL,
    isIWAD,
    isImage,
    isPDF,
    isProtonDocsDocument,
    isSupportedText,
    isVideo,
    isWordDocument,
    isXlsx,
} from '@proton/shared/lib/helpers/mimetype';
import { isPreviewTooLarge } from '@proton/shared/lib/helpers/preview';
import clsx from '@proton/utils/clsx';

import LumoDrawerLogo from '../../components/drawer/drawerIcons/LumoDrawerLogo';
import useFocusTrap from '../../components/focus/useFocusTrap';
import type { LumoAgentConfig } from '../../components/lumoAgent/types';
import useModalState from '../../components/modalTwo/useModalState';
import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';
import useBeforeUnload from '../../hooks/useBeforeUnload';
import { useHotkeys } from '../../hooks/useHotkeys';
import AudioPreview from './AudioPreview';
import CloseModal from './CloseModal';
import { ExcelPreview } from './ExcelPreview';
import type { SharedStatus } from './Header';
import Header from './Header';
import ImagePreview from './ImagePreview';
import PDFPreview from './PDFPreview';
import PreviewError from './PreviewError';
import PreviewLoader from './PreviewLoader';
import { ProtonDocsPreview } from './ProtonDocsPreview';
import { SandboxedPreview } from './SandboxedPreview';
import SignatureIssue from './SignatureIssue';
import TextPreview from './TextPreview';
import UnsupportedPreview from './UnsupportedPreview';
import VideoPreview from './VideoPreview';
import { VideoStreamingPreview } from './VideoStreamingPreview';

// Lazy Loaded since it includes jszip and it's a rare file type (not common)
const ComicBookPreview = lazy(() => import(/* webpackChunkName: "comic-book-preview" */ './ComicBookPreview'));
const IWADPreview = lazy(() => import(/* webpackChunkName: "iwad-preview" */ './IWADPreview'));

// Lazy Loaded since it includes three.js and it's a rare file type (not common)
const STLPreview = lazy(() => import(/* webpackChunkName: "stl-preview" */ './3DPreview/STLPreview'));

// Lazy Loaded so the Lumo panel and its client stay out of the bundle until the assistant is opened
const FilePreviewAssistant = lazy(() =>
    import(/* webpackChunkName: "file-preview-assistant" */ './FilePreviewAssistant').then((module) => ({
        default: module.FilePreviewAssistant,
    }))
);

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
    sheetsEnabled?: boolean;

    // For Video Streaming
    videoStreaming?: {
        url?: string;
        onVideoPlaybackError?: (error?: unknown) => void;
        videoRef?: (element: HTMLVideoElement | null) => void;
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

    /** Supply it to offer the Lumo assistant in a side panel; the product owns the tools and the rules. */
    lumoConfig?: LumoAgentConfig;
    /** Identifies the file the assistant conversation is about; changing it starts a fresh conversation. */
    lumoConversationKey?: string;
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
    sheetsEnabled,

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
    sheetsEnabled?: boolean;

    // For Video Streaming
    videoStreaming?: {
        isLoading?: boolean;
        url?: string;
        onVideoPlaybackError?: (error?: unknown) => void;
        videoRef?: (element: HTMLVideoElement | null) => void;
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

    const shouldShowLoader = isLoading && !contents && !imgThumbnailUrl;
    const isTooLarge = isPreviewTooLarge(mimeType, fileSize);

    const renderPreview = () => {
        if (error) {
            return <PreviewError error={error} />;
        }

        if (shouldShowLoader) {
            return <PreviewLoader />;
        }

        if (signatureConfirmation && !forcePreview) {
            return (
                <SignatureIssue signatureConfirmation={signatureConfirmation} onClick={() => setForcePreview(true)} />
            );
        }

        if (mimeType && isVideo(mimeType) && videoStreaming) {
            if (videoStreaming.isLoading) {
                return <PreviewLoader />;
            }
            return (
                <VideoStreamingPreview
                    isLoading={isLoading}
                    isSharedFile={isSharedFile}
                    videoStreaming={videoStreaming}
                    imgThumbnailUrl={imgThumbnailUrl}
                />
            );
        }

        // Check file size limit early for types that load content into memory
        if (isTooLarge) {
            return (
                <div className="file-preview-container">
                    <UnsupportedPreview onDownload={onDownload} tooLarge={true} />
                </div>
            );
        }

        if (mimeType && isProtonDocsDocument(mimeType)) {
            return (
                <div className="file-preview-container">
                    <ProtonDocsPreview
                        isPublic={isPublic}
                        isPublicDocsAvailable={isPublicDocsAvailable}
                        onOpenInDocs={onOpenInDocs}
                        mimeType={mimeType}
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

        if (!!mimeType && isXlsx(mimeType) && sheetsEnabled) {
            return <ExcelPreview onDownload={onDownload} onOpenInDocs={onOpenInDocs} />;
        }

        if (mimeType && isImage(mimeType) && (contents || imgThumbnailUrl)) {
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

        if (mimeType && isVideo(mimeType) && contents) {
            return (
                <VideoPreview
                    contents={contents}
                    mimeType={mimeType}
                    isSharedFile={isSharedFile}
                    onDownload={onDownload}
                />
            );
        }

        if (mimeType && contents && isAudio(mimeType)) {
            return <AudioPreview contents={contents} mimeType={mimeType} onDownload={onDownload} />;
        }

        if (mimeType && isSupportedText(mimeType)) {
            return <TextPreview contents={contents} onNewContents={onNewContents} />;
        }

        if (mimeType && isPDF(mimeType) && contents) {
            return <PDFPreview contents={contents} filename={fileName} />;
        }

        if (mimeType && isWordDocument(mimeType)) {
            if (isSafari() && !isMinimumSafariVersion(16)) {
                return (
                    <div className="file-preview-container">
                        <UnsupportedPreview onDownload={onDownload} browser />
                    </div>
                );
            }
            return <SandboxedPreview contents={contents} mimeType={mimeType} onDownload={onDownload} />;
        }

        return (
            <div className="file-preview-container">
                <UnsupportedPreview onDownload={onDownload} tooLarge={isTooLarge} />
            </div>
        );
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
        sheetsEnabled,
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
        lumoConfig,
        lumoConversationKey,
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
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    // Latches on the first open so the panel stays mounted, and its conversation alive, once closed.
    const hasOpenedAssistant = useRef(false);
    hasOpenedAssistant.current ||= isAssistantOpen;

    const { viewportWidth } = useActiveBreakpoint();
    // Below a large viewport there is no room beside the file, so the panel takes over the whole width.
    const isAssistantFullWidth = !viewportWidth['>=large'];

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
                assistantButton={
                    lumoConfig ? (
                        <Tooltip title={c('Action').t`Toggle ${LUMO_SHORT_APP_NAME}`}>
                            <Button
                                icon
                                shape="ghost"
                                onClick={() => setIsAssistantOpen((isOpen) => !isOpen)}
                                aria-controls="lumo-side-panel"
                                aria-expanded={isAssistantOpen}
                                aria-pressed={isAssistantOpen}
                                data-testid="lumo-toggle"
                            >
                                <LumoDrawerLogo size={6} />
                            </Button>
                        </Tooltip>
                    ) : undefined
                }
            >
                {isDirty ? (
                    <div className="flex items-center absolute inset-center">{c('Info').t`Unsaved changes`}</div>
                ) : (
                    navigationControls
                )}
            </Header>
            <div className="flex flex-nowrap flex-1 overflow-hidden">
                <div
                    className={clsx(
                        'flex flex-column flex-nowrap flex-1 overflow-hidden',
                        isAssistantOpen && isAssistantFullWidth && 'hidden'
                    )}
                >
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
                        sheetsEnabled={sheetsEnabled}
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
                </div>
                {/* Kept mounted once opened, and keyed on the file, so closing and reopening the panel
                    finds the same conversation while moving to another file starts a fresh one. */}
                {lumoConfig && hasOpenedAssistant.current && (
                    <aside
                        className={clsx(
                            'shrink-0 border-left border-weak',
                            isAssistantFullWidth ? 'w-full' : 'w-custom',
                            !isAssistantOpen && 'hidden'
                        )}
                        style={isAssistantFullWidth ? undefined : { '--w-custom': '23rem' }}
                        data-testid="file-preview:assistant"
                    >
                        <Suspense fallback={null}>
                            <FilePreviewAssistant
                                key={lumoConversationKey}
                                config={lumoConfig}
                                onClose={() => setIsAssistantOpen(false)}
                            />
                        </Suspense>
                    </aside>
                )}
            </div>
            <CloseModal {...closeModalProps} handleDiscard={onClose} isSaving={isSaving} />
        </div>
    );
};
export default forwardRef(FilePreview);
