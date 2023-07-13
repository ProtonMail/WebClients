import { ReactNode, Ref, forwardRef, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useCombinedRefs } from '@proton/hooks';
import { useLoading } from '@proton/hooks';
import busy from '@proton/shared/lib/busy';
import {
    isAudio,
    isPDF,
    isSupportedImage,
    isSupportedText,
    isVideo,
    isWordDocument,
} from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { useFocusTrap, useModalState } from '../../components';
import { useBeforeUnload, useHotkeys } from '../../hooks';
import AudioPreview from './AudioPreview';
import CloseModal from './CloseModal';
import Header, { SharedStatus } from './Header';
import ImagePreview from './ImagePreview';
import PDFPreview from './PDFPreview';
import PreviewError from './PreviewError';
import PreviewLoader from './PreviewLoader';
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

    contents?: Uint8Array[];
    sharedStatus?: SharedStatus;

    onClose?: () => void;
    onDownload?: () => void;
    onSave?: (content: Uint8Array[]) => Promise<void>;
    onDetail?: () => void;
    onShare?: () => void;
    onRestore?: () => void; // revision's specific
    date?: number | Date;

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

    contents,

    onDownload,
    onNewContents,

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

    contents?: Uint8Array[];

    onDownload?: () => void;
    onNewContents?: (content: Uint8Array[]) => void;

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

        if (
            !mimeType ||
            (!contents && !imgThumbnailUrl && !isSupportedText(mimeType)) ||
            !isPreviewAvailable(mimeType, fileSize)
        ) {
            return (
                <div className="file-preview-container">
                    <UnsupportedPreview onDownload={onDownload} />
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

        contents,
        navigationControls,
        sharedStatus,
        signatureStatus,
        signatureConfirmation,
        onClose,
        onDownload,
        onSave,
        onDetail,
        onShare,
        onRestore,
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
                onDetail={onDetail}
                onShare={onShare}
                onRestore={onRestore}
                date={date}
            >
                {isDirty ? (
                    <div className="flex flex-align-items-center absolute-center">{c('Info').t`Unsaved changes`}</div>
                ) : (
                    navigationControls
                )}
            </Header>
            <FilePreviewContent
                isMetaLoading={isMetaLoading}
                isLoading={isLoading}
                mimeType={mimeType}
                error={error}
                imgThumbnailUrl={imgThumbnailUrl}
                fileSize={fileSize}
                fileName={fileName}
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
