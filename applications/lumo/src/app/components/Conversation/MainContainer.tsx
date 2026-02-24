import { useCallback, useRef, useState } from 'react';

import { clsx } from 'clsx';

import { LUMO_UPSELL_PATHS } from '@proton/shared/lib/constants';

import { LumoCat } from '../LumoAvatar';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import type { HandleSendMessage } from '../../hooks/useLumoActions';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useOnboardingContext } from '../../providers/OnboardingProvider';
import type { Message } from '../../types';
import { FilesManagementView } from '../Files';
import { NewGhostChatButton } from '../Buttons/GhostChatButton/NewGhostChatButton';
import WhatsNew from '../WhatsNew/WhatsNew';
import { HeaderWrapper } from '../../layouts/header/HeaderWrapper';
import LumoNavbarUpsell from '../../upsells/composed/LumoNavbarUpsell';
import LumoMainText from './MainContainer/LumoMainText';
import LumoOnboarding from '../Onboarding/LumoOnboarding';
import { ThemedPromptSuggestion } from './MainContainer/PromptSuggestion';
import TermsAndConditions from './MainContainer/TermsAndConditions';
import { ComposerComponent } from '../Composer/ComposerComponent';

import './MainContainer.scss';

const MainContainer = ({
    handleSendMessage,
    isProcessingAttachment,
    initialQuery,
}: {
    handleSendMessage: HandleSendMessage;
    isProcessingAttachment: boolean;
    initialQuery?: string;
}) => {
    const { isOnboardingCompleted } = useOnboardingContext();
    const { isSmallScreen } = useIsLumoSmallScreen();
    const filesContainerRef = useRef<HTMLDivElement>(null);
    const isGuest = useIsGuest();
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [isEditorEmpty, setIsEditorEmpty] = useState(true);
    const [promptSuggestion, setPromptSuggestion] = useState<string | undefined>(undefined);

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

    // Handler for prompt suggestion click
    const handlePromptSuggestionClick = useCallback((prompt: string) => {
        setPromptSuggestion(prompt);
    }, []);

    // Determine if lumo-welcome-section should be visible
    // Hide when input is active (has content) on small screens, always show on large screens
    const shouldShowWelcomeSection = !isSmallScreen || isEditorEmpty;

    return (
        <>
            {isSmallScreen && (
                <HeaderWrapper>
                    <LumoNavbarUpsell feature={LUMO_UPSELL_PATHS.TOP_NAVIGATION_BAR} onlyShowOffers={true} />
                    <NewGhostChatButton />
                </HeaderWrapper>
            )}
            <div
                className="flex *:min-size-auto flex-column flex-nowrap flex-1 mx-auto justify-center items-center w-full md:max-w-custom lg:max-w-custom pb-8 pt-0"
                style={{
                    '--md-max-w-custom': '90%',
                    '--lg-max-w-custom': '43rem',
                }}
            >
                {!isSmallScreen && <NewGhostChatButton className="absolute top-0 right-0 mt-4 mr-4" />}
                <div
                    className={clsx(
                        'lumo-welcome-section flex flex-column-reverse md:flex-row w-full flex-nowrap px-8 relative',
                        isSmallScreen && 'top-custom',
                        shouldShowWelcomeSection ? 'is-visible' : 'is-hidden'
                    )}
                    style={{
                        '--top-custom': isSmallScreen ? '-6rem' : undefined,
                    }}
                >
                    <div className="main-text-container flex-1 my-auto flex flex-column relative w-full">
                        <LumoMainText
                            isOnboardingCompleted={isOnboardingCompleted}
                            isSmallScreen={isSmallScreen}
                            isGhostMode={isGhostChatMode}
                        />

                        <ThemedPromptSuggestion onClick={handlePromptSuggestionClick} canShow={!isSmallScreen} />
                    </div>
                    <LumoCat isSmallScreen={isSmallScreen} isGhostChatMode={isGhostChatMode} />
                </div>
                <ThemedPromptSuggestion
                    onClick={handlePromptSuggestionClick}
                    className="align-self-center"
                    canShow={isSmallScreen && isEditorEmpty}
                />

                <div className="composer-container md:px-4 w-full">
                    <ComposerComponent
                        handleSendMessage={handleSendMessage}
                        isProcessingAttachment={isProcessingAttachment}
                        className="fixed bottom-0 md:static w-full z-20"
                        setIsEditorFocused={setIsEditorFocused}
                        isEditorFocused={isEditorFocused}
                        setIsEditorEmpty={setIsEditorEmpty}
                        handleOpenFiles={handleOpenFiles}
                        onShowDriveBrowser={handleShowDriveBrowser}
                        canShowLegalDisclaimer={isGuest && isSmallScreen}
                        canShowLumoUpsellToggle={true}
                        initialQuery={promptSuggestion || initialQuery}
                    />
                </div>
                <WhatsNew />
                {!isSmallScreen && <LumoOnboarding />}
            </div>
            {openPanel.type === 'files' && (
                <FilesManagementView
                    messageChain={[]} // Empty message chain for MainContainer
                    filesContainerRef={filesContainerRef}
                    onClose={handleCloseFiles}
                    filterMessage={openPanel.filterMessage}
                    onClearFilter={handleClearFilter}
                    initialShowDriveBrowser={openPanel.autoShowDriveBrowser}
                    forceModal={true}
                />
            )}

            {/* Legal disclaimer for desktop - only shown in guest mode and before user starts typing */}
            {isGuest && !isSmallScreen && <TermsAndConditions />}
        </>
    );
};

export default MainContainer;
