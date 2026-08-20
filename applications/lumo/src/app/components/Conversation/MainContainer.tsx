import { useCallback, useRef, useState } from 'react';

import { useModalStateObject } from '@proton/components';

import PaperTrailPanel from '../../features/aiPaperTrail/PaperTrailPanel';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useConversationActions } from '../../providers/ConversationActionsProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import { selectTierErrors } from '../../redux/slices/meta/errors';
import { shouldShowWeeklyLimitUpsell, useRemainingLimits } from '../../services/usageLimitsStore';
import type { Attachment } from '../../types';
import { ComposerMode, type Message } from '../../types';
import UpsellCard from '../../upsells/components/UpsellCard';
import { ComposerComponent } from '../Composer/ComposerComponent';
import { FilesManagementView } from '../Files';
import { FilePreviewModal } from '../Files/Common/FilePreviewModal';
import { PublicHeader } from '../Guest/PublicHeader';
import TermsAndConditions from '../TermsAndConditions';
import WhatsNew from '../WhatsNew/WhatsNew';
import { ImageLimitNotice } from './ImageLimitNotice';
import LumoCatAnimation from './MainContainer/LumoCatAnimation';
import LumoMainText from './MainContainer/LumoMainText';
import MainContainerFooter from './MainContainer/MainContainerFooter';
import ProtectedByProton from './MainContainer/ProtectedByProton';
import { useImageLimitInfo } from './useImageLimitInfo';

import './MainContainer.scss';

// Stable reference so the image-limit memoization isn't invalidated on every render.
// The new-conversation screen has no prior messages, only composer (provisional) images.
const EMPTY_MESSAGE_CHAIN: Message[] = [];

interface MainContainerProps {
    isProcessingAttachment: boolean;
    initialQuery?: string;
    prefillQuery?: string;
}

const MainContainer = ({ isProcessingAttachment, initialQuery, prefillQuery }: MainContainerProps) => {
    const { handleSendMessage } = useConversationActions();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { aiPaperTrailPopup, aiPaperTrailRoute } = useLumoFlags();

    const filesContainerRef = useRef<HTMLDivElement>(null);
    const isGuest = useIsGuest();
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [, setIsEditorEmpty] = useState(true);
    const [promptSuggestion] = useState<string | undefined>(undefined);
    const filesModal = useModalStateObject();
    const [filesPanelState, setFilesPanelState] = useState<{
        filterMessage?: Message;
        autoShowDriveBrowser?: boolean;
    } | null>(null);
    const { isGhostChatMode } = useGhostChat();
    const filePreviewModal = useModalStateObject();
    const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
    const tierErrors = useLumoSelector((state) => selectTierErrors({ errors: state.errors }));
    const { hasLumoPlus } = useLumoPlan();
    const remainingLimits = useRemainingLimits();
    const showWeeklyLimitUpsell = shouldShowWeeklyLimitUpsell(remainingLimits, tierErrors.length > 0, hasLumoPlus);
    const { exceedsLimit: imageLimitExceeded } = useImageLimitInfo(EMPTY_MESSAGE_CHAIN);
    const handleOpenFilePreview = useCallback(
        (attachment: Attachment) => {
            setPreviewAttachment(attachment);
            filePreviewModal.openModal(true);
        },
        [filePreviewModal]
    );

    // Files panel handlers
    const handleOpenFiles = useCallback(
        (message?: Message) => {
            setFilesPanelState({
                filterMessage: message,
                autoShowDriveBrowser: false,
            });
            filesModal.openModal(true);
        },
        [filesModal]
    );

    const handleShowDriveBrowser = useCallback(() => {
        setFilesPanelState({ autoShowDriveBrowser: true });
        filesModal.openModal(true);
    }, [filesModal]);

    const handleCloseFiles = filesModal.modalProps.onClose;

    const handleClearFilter = useCallback(() => {
        setFilesPanelState((prev) =>
            prev ? { ...prev, filterMessage: undefined, autoShowDriveBrowser: false } : null
        );
    }, []);

    return (
        <>
            <LumoLayoutWithDrawer header={{ component: isGuest ? <PublicHeader /> : null }} drawer={{ disabled: true }}>
                <div className="main-container-component rounded-xl flex flex-column flex-nowrap flex-1">
                    <div
                        className="flex *:min-size-auto flex-column flex-nowrap flex-1 mx-auto justify-center items-center w-full md:max-w-custom lg:max-w-custom pt-0 main-container-content"
                        style={{
                            '--md-max-w-custom': '90%',
                            '--lg-max-w-custom': '43rem',
                        }}
                    >
                        <div className="lumo-welcome-section flex flex-column items-center text-center w-full">
                            <LumoCatAnimation isGhostMode={isGhostChatMode} />
                            <LumoMainText isSmallScreen={isSmallScreen} isGhostMode={isGhostChatMode} />
                        </div>
                        {aiPaperTrailRoute && aiPaperTrailPopup && <PaperTrailPanel />}

                        <div className="composer-container md:px-4 w-full relative">
                            {showWeeklyLimitUpsell && <UpsellCard showSadCat={false} error={tierErrors[0]} />}
                            <ImageLimitNotice exceedsLimit={imageLimitExceeded} />
                            <ComposerComponent
                                composerMode={ComposerMode.NEW_CONVERSATION}
                                handleSendMessage={handleSendMessage}
                                isProcessingAttachment={isProcessingAttachment}
                                className="main-container fixed bottom-0 md:static w-full z-20"
                                setIsEditorFocused={setIsEditorFocused}
                                isEditorFocused={isEditorFocused}
                                setIsEditorEmpty={setIsEditorEmpty}
                                handleOpenFiles={handleOpenFiles}
                                onShowDriveBrowser={handleShowDriveBrowser}
                                onOpenFilePreview={handleOpenFilePreview}
                                canShowLegalDisclaimer={isGuest && isSmallScreen}
                                canShowLumoUpsellToggle={true}
                                initialQuery={promptSuggestion || initialQuery}
                                prefillQuery={prefillQuery}
                                optionalElementBelowComposer={
                                    isGuest ? (
                                        <TermsAndConditions className="m-0 hidden md:block" />
                                    ) : (
                                        <ProtectedByProton />
                                    )
                                }
                            />
                            {/* <Blobs /> */}
                        </div>
                        <WhatsNew />
                    </div>
                    {filePreviewModal.render && previewAttachment && (
                        <FilePreviewModal attachment={previewAttachment} {...filePreviewModal.modalProps} />
                    )}
                    {filesModal.render && filesPanelState && (
                        <FilesManagementView
                            messageChain={[]}
                            filesContainerRef={filesContainerRef}
                            onClose={handleCloseFiles}
                            modalProps={filesModal.modalProps}
                            filterMessage={filesPanelState.filterMessage}
                            onClearFilter={handleClearFilter}
                            initialShowDriveBrowser={filesPanelState.autoShowDriveBrowser}
                            forceModal={true}
                        />
                    )}

                    <MainContainerFooter />
                </div>
            </LumoLayoutWithDrawer>
        </>
    );
};

export default MainContainer;
