import React, { forwardRef, Ref, useRef } from 'react';
import { c } from 'ttag';
import Header, { SharedStatus } from './Header';
import ImagePreview from './ImagePreview';
import PreviewLoader from './PreviewLoader';
import TextPreview from './TextPreview';
import UnsupportedPreview from './UnsupportedPreview';
import PDFPreview from './PDFPreview';
import { isPreviewAvailable, isSupportedImage, isSupportedText, isPDF } from './helpers';
import { useCombinedRefs, useHotkeys } from '../../hooks';
import { useFocusTrap } from '../../components';

interface Props {
    loading: boolean;
    fileName?: string;
    mimeType?: string;
    navigationControls?: React.ReactNode;
    contents?: Uint8Array[];
    sharedStatus?: SharedStatus;
    onClose?: () => void;
    onSave?: () => void;
    onDetail?: () => void;
    onShare?: () => void;
}

const FilePreview = (
    {
        contents,
        fileName,
        mimeType,
        loading,
        navigationControls,
        sharedStatus,
        onClose,
        onSave,
        onDetail,
        onShare,
    }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const combinedRefs = useCombinedRefs<HTMLDivElement>(ref, rootRef);
    const focusTrapProps = useFocusTrap({
        rootRef,
    });

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
        if (!mimeType || !isPreviewAvailable(mimeType)) {
            return (
                <div className="file-preview-container">
                    <UnsupportedPreview onSave={onSave} />
                </div>
            );
        }

        if (!contents) {
            throw new Error(c('Error').t`File has no contents to preview`);
        }

        if (isSupportedImage(mimeType)) {
            return <ImagePreview contents={contents} mimeType={mimeType} onSave={onSave} />;
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
                onClose={onClose}
                onSave={onSave}
                onDetail={onDetail}
                onShare={onShare}
            >
                {navigationControls}
            </Header>
            {loading ? <PreviewLoader /> : renderPreview()}
        </div>
    );
};

export default forwardRef(FilePreview);
