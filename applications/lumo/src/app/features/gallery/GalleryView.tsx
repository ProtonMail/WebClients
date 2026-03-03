import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { HeaderWrapper } from '../../layouts/header/HeaderWrapper';
import { useSidebar } from '../../providers/SidebarProvider';
import { useLumoNavigate as useNavigate } from '../../hooks/useLumoNavigate';
import type { HandleSendMessage } from '../../hooks/useLumoActions';
import { ComposerComponent } from '../../components/Composer/ComposerComponent';
import { useFileHandling } from '../../components/Composer/hooks/useFileHandling';
import { base64ToFile } from '../../util/imageHelpers';
import type { DrawingMode } from '../../features/drawingcanvas/types';
import type { GalleryPromptSuggestion } from './promptSuggestions';
import { DiscoverPanel } from './DiscoverPanel';
import { CreatedGrid } from './CreatedGrid';
import { useGeneratedGalleryImages } from './hooks/useGeneratedGalleryImages';
import { LazyLottie } from '../../components/LazyLottie';

import './GalleryView.scss';

export interface GalleryViewProps {
    handleSendMessage: HandleSendMessage;
    isProcessingAttachment: boolean;
    prefillQuery?: string;
    autoOpenSketch?: boolean;
    autoOpenUpload?: boolean;
}

export const GalleryView = ({
    handleSendMessage,
    isProcessingAttachment,
    prefillQuery: externalPrefill,
    autoOpenSketch: externalAutoOpenSketch,
    autoOpenUpload,
}: GalleryViewProps) => {
    const { isSmallScreen } = useSidebar();
    const navigate = useNavigate();

    const { handleFilesSelected } = useFileHandling({ messageChain: [] });
    const editImageFileRef = useRef<HTMLInputElement>(null);
    const createdScrollRef = useRef<HTMLDivElement>(null);
    const pendingEditPromptRef = useRef<string>('');
    const [composerPrefill, setComposerPrefill] = useState<string | undefined>(externalPrefill);
    const [gallerySketchTrigger, setGallerySketchTrigger] = useState(externalAutoOpenSketch ?? false);

    // Hoisted gallery data — used to decide top-pane content and passed to CreatedGrid
    const galleryImages = useGeneratedGalleryImages();
    const allItems = useMemo(() => galleryImages.sections.flatMap((s) => s.items), [galleryImages.sections]);
    const showGallery = allItems.length > 0 || galleryImages.status === 'loading' || galleryImages.status === 'error';

    const handleSketchEditExport = useCallback(
        async (imageData: string, _mode: DrawingMode, description: string) => {
            const file = base64ToFile(imageData, `edited-image-${Date.now()}.png`);
            handleFilesSelected([file]);
            setComposerPrefill(description || c('collider_2025:Prefill').t`Edit this image:`);
        },
        [handleFilesSelected]
    );

    const handleSuggestionClick = useCallback(
        (suggestion: GalleryPromptSuggestion) => {
            if (suggestion.action === 'sketch') {
                setComposerPrefill(suggestion.prompt);
                setGallerySketchTrigger(true);
                setTimeout(() => setGallerySketchTrigger(false), 0);
            } else if (suggestion.action === 'edit_image') {
                pendingEditPromptRef.current = suggestion.prompt;
                editImageFileRef.current?.click();
            } else {
                navigate(`/?q=${encodeURIComponent(suggestion.prompt)}`);
            }
        },
        [navigate]
    );

    // Suppress hover overlays while the created section is scrolling
    useEffect(() => {
        const el = createdScrollRef.current;
        if (!el) return;
        let timeout: ReturnType<typeof setTimeout>;
        const onScroll = () => {
            el.classList.add('is-scrolling');
            clearTimeout(timeout);
            timeout = setTimeout(() => el.classList.remove('is-scrolling'), 150);
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', onScroll);
            clearTimeout(timeout);
        };
    }, []);

    const handleEditImageFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length === 0) return;
            handleFilesSelected(files);
            setComposerPrefill(pendingEditPromptRef.current);
            e.target.value = '';
        },
        [handleFilesSelected]
    );

    return (
        <div className="gallery-view">
            <input
                ref={editImageFileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={handleEditImageFileChange}
            />

            {isSmallScreen && (
                <HeaderWrapper>
                    <div />
                </HeaderWrapper>
            )}

            {/* Top pane — image gallery or Lottie empty state */}
            {showGallery ? (
                <div ref={createdScrollRef} className="gallery-created-scroll">
                    <div className="gallery-inner">
                        <CreatedGrid
                            sections={galleryImages.sections}
                            status={galleryImages.status}
                            hasMore={galleryImages.hasMore}
                            loadMore={galleryImages.loadMore}
                            onExport={handleSketchEditExport}
                        />
                    </div>
                </div>
            ) : (
                <div className="gallery-empty">
                    <LazyLottie
                        getAnimationData={() => import('../../components/Animations/lumo-image.json')}
                        loop
                        autoplay
                        className="gallery-empty__lottie"
                    />
                    <h1 className="gallery-empty__title">
                        {c('collider_2025:Title').t`What do you want to create today?`}
                    </h1>
                </div>
            )}

            {/* Bottom panel — suggestions + composer, always visible */}
            <div className="gallery-bottom">
                <div className="gallery-inner">
                    <DiscoverPanel onSuggestionClick={handleSuggestionClick} />

                    <div className="gallery-composer-wrapper">
                        <ComposerComponent
                            handleSendMessage={handleSendMessage}
                            isProcessingAttachment={isProcessingAttachment}
                            prefillQuery={composerPrefill}
                            autoOpenSketch={gallerySketchTrigger}
                            autoOpenUpload={autoOpenUpload}
                            canShowLumoUpsellToggle={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
