import { useCallback, useRef, useState } from 'react';

import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import { LumoLayoutWithDrawer } from '../../layouts/LumoLayout';
import { useConversationActions } from '../../providers/ConversationActionsProvider';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
// import { useOnboardingContext } from '../../providers/OnboardingProvider';
import { ComposerMode, type Message } from '../../types';
import { ComposerComponent } from '../Composer/ComposerComponent';
import { FilesManagementView } from '../Files';
import { PublicHeader } from '../Guest/PublicHeader';
import TermsAndConditions from '../TermsAndConditions';
import WhatsNew from '../WhatsNew/WhatsNew';
import LumoMainText from './MainContainer/LumoMainText';
import MainContainerFooter from './MainContainer/MainContainerFooter';
import ProtectedByProton from './MainContainer/ProtectedByProton';

import './MainContainer.scss';

interface MainContainerProps {
    isProcessingAttachment: boolean;
    initialQuery?: string;
    prefillQuery?: string;
}

const MainContainer = ({ isProcessingAttachment, initialQuery, prefillQuery }: MainContainerProps) => {
    const { handleSendMessage } = useConversationActions();
    // const { isOnboardingCompleted } = useOnboardingContext();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const filesContainerRef = useRef<HTMLDivElement>(null);
    const isGuest = useIsGuest();
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [, setIsEditorEmpty] = useState(true);
    const [promptSuggestion] = useState<string | undefined>(undefined);
    // Files panel states
    const [openPanel, setOpenPanel] = useState<{
        type: 'files' | null;
        filterMessage?: Message;
        autoShowDriveBrowser?: boolean;
    }>({ type: null });
    const { isGhostChatMode } = useGhostChat();

    // Files panel handlers
    const handleOpenFiles = useCallback((message?: Message) => {
        if (message) {
            setOpenPanel({ type: 'files', filterMessage: message, autoShowDriveBrowser: false });
        } else {
            setOpenPanel({ type: 'files', filterMessage: undefined, autoShowDriveBrowser: false });
        }
    }, []);

    const handleShowDriveBrowser = useCallback(() => {
        setOpenPanel({ type: 'files', filterMessage: undefined, autoShowDriveBrowser: true });
    }, []);

    const handleCloseFiles = useCallback(() => {
        setOpenPanel({ type: null });
    }, []);

    const handleClearFilter = useCallback(() => {
        setOpenPanel({ type: 'files', filterMessage: undefined, autoShowDriveBrowser: false });
    }, []);

    // // Handler for prompt suggestion click
    // const handlePromptSuggestionClick = useCallback((prompt: string) => {
    //     setPromptSuggestion(prompt);
    // }, []);

    // // Determine if lumo-welcome-section should be visible
    // // Hide when input is active (has content) on small screens, always show on large screens
    // const shouldShowWelcomeSection = !isSmallScreen || isEditorEmpty;

    return (
        <LumoLayoutWithDrawer
            headerComponent={isGuest ? <PublicHeader /> : null}
            drawerContentComponent={
                <div className="flex flex-column  items-center gap-2 justify-center items-center flex-1">
                    <FilesManagementView
                        messageChain={[]}
                        filesContainerRef={filesContainerRef}
                        onClose={handleCloseFiles}
                        filterMessage={openPanel.filterMessage}
                        onClearFilter={handleClearFilter}
                        initialShowDriveBrowser={false}
                    />
                </div>
            }
        >
            <div className="main-container-component bg-norm rounded-xl flex flex-column flex-nowrap flex-1">
                {/* {isSmallScreen && (
                    <HeaderWrapper>
                        <LumoNavbarUpsell feature={LUMO_UPSELL_PATHS.TOP_NAVIGATION_BAR} onlyShowOffers={true} />
                        <NewGhostChatButton />
                    </HeaderWrapper>
                )}
                {isGuest && <PublicHeader />} */}
                <div
                    className="flex *:min-size-auto flex-column flex-nowrap flex-1 mx-auto justify-center items-center w-full md:max-w-custom lg:max-w-custom pt-0"
                    style={{
                        '--md-max-w-custom': '90%',
                        '--lg-max-w-custom': '43rem',
                    }}
                >
                    <LumoMainText
                        // isOnboardingCompleted={isOnboardingCompleted}
                        isSmallScreen={isSmallScreen}
                        isGhostMode={isGhostChatMode}
                    />
                    <div className="composer-container md:px-4 w-full">
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
                            canShowLegalDisclaimer={isGuest && isSmallScreen}
                            canShowLumoUpsellToggle={true}
                            initialQuery={promptSuggestion || initialQuery}
                            prefillQuery={prefillQuery}
                            optionalElementBelowComposer={
                                isGuest ? <TermsAndConditions className="m-0 hidden md:block" /> : <ProtectedByProton />
                            }
                        />
                    </div>
                    <WhatsNew />
                </div>
                {openPanel.type === 'files' && (
                    <FilesManagementView
                        messageChain={[]}
                        filesContainerRef={filesContainerRef}
                        onClose={handleCloseFiles}
                        filterMessage={openPanel.filterMessage}
                        onClearFilter={handleClearFilter}
                        initialShowDriveBrowser={openPanel.autoShowDriveBrowser}
                        forceModal={true}
                    />
                )}

                <MainContainerFooter />
            </div>
        </LumoLayoutWithDrawer>
    );
};

export default MainContainer;
