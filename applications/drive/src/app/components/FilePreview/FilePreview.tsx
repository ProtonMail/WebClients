import React from 'react';
import { isSafari } from 'proton-shared/lib/helpers/browser';
import { c } from 'ttag';
import Header from './Header';
import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { DriveFile } from '../../interfaces/file';
import ImagePreview from './ImagePreview';
import PreviewLoader from './PreviewLoader';
import TextPreview from './TextPreview';
import UnsupportedPreview from './UnsupportedPreview';
import NavigationControl from './NavigationControl';
import { DriveLink } from '../../interfaces/link';
import useKeyPress from '../../hooks/useKeyPress';

export const isSupportedImage = (mimeType: string) =>
    [
        'image/apng',
        'image/bmp',
        'image/gif',
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        !isSafari() && 'image/webp'
    ]
        .filter(Boolean)
        .includes(mimeType);

export const isSupportedText = (mimeType: string) => mimeType.startsWith('text/');

// Will include more rules in the future
export const isPreviewAvailable = (mimeType: string) => isSupportedImage(mimeType) || isSupportedText(mimeType);

interface Props {
    loading: boolean;
    meta?: DriveFile | DriveLink | FileBrowserItem;
    contents?: Uint8Array[];
    onClose?: () => void;
    onSave?: () => void;
    availableLinks?: DriveLink[];
    onOpen?: (link: DriveLink) => void;
}

const FilePreview = ({ contents, meta, loading, availableLinks = [], onOpen, onClose, onSave }: Props) => {
    const totalAvailable = availableLinks.length;
    const linkId = meta && ('ID' in meta ? meta.ID : meta.LinkID);
    const currentOpenIndex = availableLinks.findIndex(({ LinkID }) => LinkID === linkId);

    const handleNext = () => currentOpenIndex < totalAvailable - 1 && onOpen?.(availableLinks[currentOpenIndex + 1]);
    const handlePrev = () => currentOpenIndex > 0 && onOpen?.(availableLinks[currentOpenIndex - 1]);

    useKeyPress(
        (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            } else if (currentOpenIndex !== -1 && e.key === 'ArrowLeft') {
                handlePrev();
            } else if (currentOpenIndex !== -1 && e.key === 'ArrowRight') {
                handleNext();
            }
        },
        [currentOpenIndex]
    );

    const renderPreview = () => {
        if (!meta || !isPreviewAvailable(meta.MimeType)) {
            return <UnsupportedPreview onSave={onSave} />;
        }

        if (!contents) {
            throw new Error(c('Error').t`File has not contents to preview`);
        }

        if (isSupportedImage(meta.MimeType)) {
            return <ImagePreview contents={contents} mimeType={meta.MimeType} />;
        } else if (isSupportedText(meta.MimeType)) {
            return <TextPreview contents={contents} />;
        }
    };

    return (
        <div
            onKeyPress={() => {
                console.log('asd');
            }}
            className="pd-file-preview"
        >
            <Header name={meta?.Name} onClose={onClose} onSave={onSave}>
                {totalAvailable > 0 && onOpen && currentOpenIndex !== -1 && (
                    <NavigationControl
                        current={currentOpenIndex + 1}
                        total={totalAvailable}
                        onPrev={handlePrev}
                        onNext={handleNext}
                    />
                )}
            </Header>
            {loading ? <PreviewLoader /> : renderPreview()}
        </div>
    );
};
export default FilePreview;
