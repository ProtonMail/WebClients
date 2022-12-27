import { ReactNode, Ref, forwardRef, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import busy from '@proton/shared/lib/busy';
import {
    isAudio,
    isPDF,
    isSupportedImage,
    isSupportedText,
    isSupportedVideo,
} from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { useFocusTrap, useModalState } from '../../components';
import { useBeforeUnload, useCombinedRefs, useHotkeys, useLoading } from '../../hooks';
import AudioPreview from './AudioPreview';
import CloseModal from './CloseModal';
import Header, { SharedStatus } from './Header';
import ImagePreview from './ImagePreview';
import PDFPreview from './PDFPreview';
import PreviewError from './PreviewError';
import PreviewLoader from './PreviewLoader';
import SignatureIssue from './SignatureIssue';
import TextPreview from './TextPreview';
import UnsupportedPreview from './UnsupportedPreview';
import VideoPreview from './VideoPreview';

interface Props {
    isMetaLoading?: boolean;
    isLoading: boolean;
    error?: string;

    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    navigationControls?: ReactNode;
    contents?: Uint8Array[];
    sharedStatus?: SharedStatus;
    signatureStatus?: ReactNode;
    signatureConfirmation?: ReactNode;
    imgThumbnailUrl?: string;
    onClose?: () => void;
    onDownload?: () => void;
    onSave?: (content: Uint8Array[]) => Promise<void>;
    onDetail?: () => void;
    onShare?: () => void;
}

const FilePreview = (
    {
        isMetaLoading = false,
        isLoading = false,
        error,

        contents,
        fileName,
        mimeType,
        fileSize,
        navigationControls,
        sharedStatus,
        signatureStatus,
        signatureConfirmation,
        onClose,
        onDownload,
        onSave,
        onDetail,
        onShare,
        imgThumbnailUrl,
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const combinedRefs = useCombinedRefs<HTMLDivElement>(ref, rootRef);
    const focusTrapProps = useFocusTrap({
        rootRef,
    });
    const [forcePreview, setForcePreview] = useState(false);

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

    const renderPreview = () => {
        if (error) {
            return <PreviewError error={error} />;
        }

        if (!imgThumbnailUrl && isLoading) {
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
                    placeholderSrc={imgThumbnailUrl}
                    contents={contents}
                    mimeType={mimeType}
                    onDownload={onDownload}
                />
            );
        }
        if (isSupportedVideo(mimeType, fileSize)) {
            return <VideoPreview contents={contents} mimeType={mimeType} onDownload={onDownload} />;
        }
        if (isAudio(mimeType)) {
            return <AudioPreview contents={contents} mimeType={mimeType} onDownload={onDownload} />;
        }
        if (isSupportedText(mimeType)) {
            return (
                <TextPreview
                    contents={contents}
                    onNewContents={
                        onSave
                            ? (content: Uint8Array[]) => {
                                  setIsDirty(true);
                                  setNewContent(content);
                              }
                            : undefined
                    }
                />
            );
        }
        if (isPDF(mimeType)) {
            return <PDFPreview contents={contents} filename={fileName} />;
        }
    };

    return (
        <div className="file-preview ui-prominent" ref={combinedRefs} {...focusTrapProps}>
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
            >
                {isDirty ? (
                    <div className="flex flex-align-items-center absolute-center">{c('Info').t`Unsaved changes`}</div>
                ) : (
                    navigationControls
                )}
            </Header>
            {isMetaLoading ? <PreviewLoader /> : renderPreview()}
            <CloseModal {...closeModalProps} handleDiscard={onClose} isSaving={isSaving} />
        </div>
    );
};

export default forwardRef(FilePreview);
