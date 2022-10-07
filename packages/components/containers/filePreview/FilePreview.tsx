import { ReactNode, Ref, forwardRef, useRef, useState } from 'react';

import {
    isAudio,
    isPDF,
    isSupportedImage,
    isSupportedText,
    isSupportedVideo,
} from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { useFocusTrap } from '../../components';
import { useCombinedRefs, useHotkeys } from '../../hooks';
import AudioPreview from './AudioPreview';
import Header, { SharedStatus } from './Header';
import ImagePreview from './ImagePreview';
import PDFPreview from './PDFPreview';
import PreviewLoader from './PreviewLoader';
import SignatureIssue from './SignatureIssue';
import TextPreview from './TextPreview';
import UnsupportedPreview from './UnsupportedPreview';
import VideoPreview from './VideoPreview';

interface Props {
    isMetaLoading?: boolean;
    isLoading: boolean;

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
    onSave?: () => void;
    onDetail?: () => void;
    onShare?: () => void;
}

const FilePreview = (
    {
        isMetaLoading = false,
        isLoading = false,

        contents,
        fileName,
        mimeType,
        fileSize,
        navigationControls,
        sharedStatus,
        signatureStatus,
        signatureConfirmation,
        onClose,
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

    useHotkeys(rootRef, [
        [
            'Escape',
            (e) => {
                e.stopPropagation();
                onClose?.();
            },
        ],
    ]);

    const renderPreview = () => {
        if (!imgThumbnailUrl && isLoading) {
            return <PreviewLoader />;
        }

        if (signatureConfirmation && !forcePreview) {
            return (
                <SignatureIssue signatureConfirmation={signatureConfirmation} onClick={() => setForcePreview(true)} />
            );
        }

        if ((!contents && !imgThumbnailUrl) || !mimeType || !isPreviewAvailable(mimeType, fileSize)) {
            return (
                <div className="file-preview-container">
                    <UnsupportedPreview onSave={onSave} />
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
                    onSave={onSave}
                />
            );
        }
        if (isSupportedVideo(mimeType, fileSize)) {
            return <VideoPreview contents={contents} mimeType={mimeType} onSave={onSave} />;
        }
        if (isAudio(mimeType)) {
            return <AudioPreview contents={contents} mimeType={mimeType} onSave={onSave} />;
        }
        if (isSupportedText(mimeType)) {
            return <TextPreview contents={contents} />;
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
                onClose={onClose}
                onSave={onSave}
                onDetail={onDetail}
                onShare={onShare}
            >
                {navigationControls}
            </Header>
            {isMetaLoading ? <PreviewLoader /> : renderPreview()}
        </div>
    );
};

export default forwardRef(FilePreview);
