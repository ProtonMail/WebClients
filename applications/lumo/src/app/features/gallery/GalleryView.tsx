import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import lumoImageLight from '@proton/styles/assets/img/lumo/lumo-image-light.svg';

import { ComposerComponent } from '../../components/Composer/ComposerComponent';
import { useFileHandling } from '../../components/Composer/hooks/useFileHandling';
import { useNativeComposerVisibilityApi } from '../../components/Composer/hooks/useNativeComposerVisibilityApi';
import { GuestSignInState } from '../../components/GuestSignInState/GuestSignInState';
import { LazyLottie } from '../../components/LazyLottie';
import type { DrawingMode } from '../../features/drawingcanvas/types';
import type { HandleSendMessage } from '../../hooks/useLumoActions';
import { useLumoNavigate as useNavigate } from '../../hooks/useLumoNavigate';
import { HeaderWrapper } from '../../layouts/header/HeaderWrapper';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useSidebar } from '../../providers/SidebarProvider';
import { injectNativeImageGenerationHelper } from '../../remote/nativeComposerBridgeHelpers';
import { ComposerMode } from '../../types';
import { base64ToFile } from '../../util/imageHelpers';
import { CreatedGrid } from './CreatedGrid';
import { InspirationPanel } from './InspirationPanel';
import { useGeneratedGalleryImages } from './hooks/useGeneratedGalleryImages';
import { useNativeComposerImageGenerationStateApi } from './hooks/useNativeComposerImageGenerationStateApi';
import type { GalleryPromptSuggestion } from './promptSuggestions';

import './GalleryView.scss';

type GalleryTab = 'gallery' | 'inspiration';

interface GalleryEmptyProps {
    onInspirationClick: () => void;
}

const GalleryEmpty = ({ onInspirationClick }: GalleryEmptyProps) => {
    const link = (
        <InlineLinkButton key="inspiration-link" type="button" onClick={onInspirationClick}>
            {c('collider_2025:Action').t`here`}
        </InlineLinkButton>
    );

    return (
        <div className="gallery-empty">
            <LazyLottie
                getAnimationData={() => import('../../components/Animations/lumo-image.json')}
                loop
                autoplay
                className="gallery-empty__lottie"
            />
            <div className="gallery-empty-container flex flex-column items-center justify-center gap-2 mt-6 text-center">
                <p className="text-xl color-norm text-semibold m-0">
                    {c('collider_2025:Title').t`Get started by generating an image`}
                </p>
                <p className="color-weak m-0">
                    {c('collider_2025:Info')
                        .jt`Generate images, apply styles, and sketch ideas. For inspiration, click ${link}.`}
                </p>
            </div>
        </div>
    );
};

export interface GalleryViewProps {
    handleSendMessage: HandleSendMessage;
    isProcessingAttachment: boolean;
    prefillQuery?: string;
}

export const GalleryView = ({
    handleSendMessage,
    isProcessingAttachment,
    prefillQuery: externalPrefill,
}: GalleryViewProps) => {
    const { isSmallScreen } = useSidebar();
    const isGuest = useIsGuest();
    const navigate = useNavigate();

    const { handleFilesSelected } = useFileHandling({ messageChain: [] });
    const editImageFileRef = useRef<HTMLInputElement>(null);
    const createdScrollRef = useRef<HTMLDivElement>(null);
    const pendingEditPromptRef = useRef<string>('');
    const [composerPrefill, setComposerPrefill] = useState<string | undefined>(externalPrefill);
    const [gallerySketchTrigger, setGallerySketchTrigger] = useState(false);
    const nativeComposerVisibilityApi = useNativeComposerVisibilityApi();

    // Hoisted gallery data — used to decide default tab and passed to CreatedGrid
    const galleryImages = useGeneratedGalleryImages();
    const hasImages = useMemo(
        () =>
            galleryImages.sections.some((s) => s.items.length > 0) ||
            galleryImages.status === 'loading' ||
            galleryImages.status === 'error',
        [galleryImages.sections, galleryImages.status]
    );

    const [activeTab, setActiveTab] = useState<GalleryTab>(() => (hasImages ? 'gallery' : 'inspiration'));

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
                if (nativeComposerVisibilityApi.showWebComposer()) {
                    setComposerPrefill(suggestion.prompt);
                }
                pendingEditPromptRef.current = suggestion.prompt;
                setGallerySketchTrigger(true);
                setTimeout(() => setGallerySketchTrigger(false), 0);
                injectNativeImageGenerationHelper(pendingEditPromptRef.current);
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
            if (nativeComposerVisibilityApi.showWebComposer()) {
                setComposerPrefill(pendingEditPromptRef.current);
            }
            injectNativeImageGenerationHelper(pendingEditPromptRef.current);
            e.target.value = '';
        },
        [handleFilesSelected]
    );

    useNativeComposerImageGenerationStateApi();

    if (isGuest) {
        return (
            <div className="gallery-view">
                {isSmallScreen && (
                    <HeaderWrapper>
                        <div />
                    </HeaderWrapper>
                )}
                <GuestSignInState
                    image={lumoImageLight}
                    imageAlt=""
                    title={c('collider_2025:Title').t`Sign in to build your gallery`}
                    description={c('collider_2025:Info')
                        .t`Create images, apply styles, and sketch ideas. Sign in or create a free account to save your creations.`}
                />
            </div>
        );
    }

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

            {/* Tab toggle */}
            <div className="gallery-tab-bar">
                <div className="gallery-tab-toggle">
                    <button
                        className={`gallery-tab-toggle__btn${activeTab === 'inspiration' ? ' gallery-tab-toggle__btn--active' : ''}`}
                        onClick={() => setActiveTab('inspiration')}
                        type="button"
                    >
                        {c('collider_2025:Tab').t`Create`}
                    </button>
                    <button
                        className={`gallery-tab-toggle__btn${activeTab === 'gallery' ? ' gallery-tab-toggle__btn--active' : ''}`}
                        onClick={() => setActiveTab('gallery')}
                        type="button"
                    >
                        {c('collider_2025:Tab').t`Gallery`}
                    </button>
                </div>
            </div>

            {/* Main scrollable area — switches between Gallery and Inspiration */}
            {/* eslint-disable-next-line no-nested-ternary */}
            {activeTab === 'gallery' ? (
                hasImages ? (
                    <div ref={createdScrollRef} className="gallery-created-scroll">
                        <div className="gallery-inner max-w-full">
                            <CreatedGrid
                                // sections={FAKE_GALLERY_SECTIONS}
                                sections={galleryImages.sections}
                                status={galleryImages.status}
                                hasMore={galleryImages.hasMore}
                                loadMore={galleryImages.loadMore}
                                onExport={handleSketchEditExport}
                            />
                        </div>
                    </div>
                ) : (
                    <GalleryEmpty onInspirationClick={() => setActiveTab('inspiration')} />
                )
            ) : (
                <div className="gallery-inspiration-scroll flex">
                    <InspirationPanel onSuggestionClick={handleSuggestionClick} />
                    {/* <DiscoverPanel onSuggestionClick={handleSuggestionClick} /> */}
                </div>
            )}

            {/* Bottom panel — composer only, always visible */}
            <div
                className={clsx(
                    'gallery-bottom w-full',
                    !isSmallScreen && activeTab === 'gallery' && hasImages && 'absolute'
                )}
            >
                <div className="gallery-inner">
                    <div className="gallery-composer-wrapper">
                        <ComposerComponent
                            composerMode={ComposerMode.GALLERY}
                            handleSendMessage={handleSendMessage}
                            isProcessingAttachment={isProcessingAttachment}
                            prefillQuery={composerPrefill}
                            autoOpenSketch={gallerySketchTrigger}
                            placeholder={c('collider_2025:Placeholder').t`Describe your image...`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
