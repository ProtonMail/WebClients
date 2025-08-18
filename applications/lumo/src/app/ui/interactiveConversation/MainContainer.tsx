import { useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import LottieView from 'lottie-react';
import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import { Icon, useModalStateObject } from '@proton/components';
import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import lumoShield from '@proton/styles/assets/img/lumo/discussion-locks.svg';
import locks from '@proton/styles/assets/img/lumo/lock-closed.svg';
import lumoGhost from '@proton/styles/assets/img/lumo/lumo-sit-side-ghost.svg';
import shieldCheck from '@proton/styles/assets/img/lumo/shield-check.svg';

import lumoCatWaiting from '../../components/Animations/lumo-cat.json';
import { useIsLumoSmallScreen } from '../../hooks/useIsLumoSmallScreen';
import type { HandleSendMessage } from '../../hooks/useLumoActions';
import { useGhostChat } from '../../providers/GhostChatProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useOnboardingContext } from '../../providers/OnboardingProvider';
import type { Message } from '../../types';
import { FilesManagementView } from '../components/Files';
import { NewGhostChatButton } from '../components/NewGhostChatButton';
import OnboardingModal from '../components/OnboardingModal';
import { HeaderWrapper } from '../header/HeaderWrapper';
import { ComposerComponent } from './composer/ComposerComponent';

interface OnboardingSectionProps {
    onClick: () => void;
    onClose: () => void;
}

const OnboardingSection = ({ onClick, onClose }: OnboardingSectionProps) => {
    const lumoCharacteristics = [
        {
            title: c('collider_2025: Characteristic Title').t`Private`,
            characteristic: c('collider_2025: Characteristic')
                .t`Unlike other assistants, I don't record our conversations.`,
            img: lumoShield,
        },
        {
            title: c('collider_2025: Characteristic Title').t`Safeguarded`,
            characteristic: c('collider_2025: Characteristic').t`Not even ${BRAND_NAME} can access our chat history.`,
            img: locks,
        },
        {
            title: c('collider_2025: Characteristic Title').t`Treated with respect`,
            characteristic: c('collider_2025: Characteristic').t`Our conversations are never used for training.`,
            img: shieldCheck,
        },
    ];

    return (
        <div className="flex flex-column flex-nowrap gap-4 mt-6 bg-norm p-2 rounded-xl pb-8 border border-weak mx-8">
            <div className="flex flex-row flex-nowrap justify-space-between items-center ml-2">
                <h2 className="text-rg text-semibold">{c('collider_2025:Title').t`Whatever you ask me is:`}</h2>
                <div className="flex flex-row flex-nowrap gap-2 items-center">
                    <InlineLinkButton onClick={onClick} className="text-no-decoration text-semibold">{c(
                        'collider_2025: Button'
                    ).t`Learn more`}</InlineLinkButton>
                    <Button size="small" icon shape="ghost" onClick={onClose}>
                        <Icon name="cross" size={5} alt={c('collider_2025: Action').t`Dismiss`} />
                    </Button>
                </div>
            </div>
            <div className="flex flex-row flex-nowrap gap-2 mx-4">
                {lumoCharacteristics.map((characteristic) => (
                    <div key={characteristic.title} className="flex-1 flex flex-column gap-2 flex-nowrap">
                        <div className="min-h-custom flex" style={{ '--min-h-custom': '43px' }}>
                            <img className="shrink-0 my-auto" src={characteristic.img} alt="" />
                        </div>
                        <p className="m-0 text-semibold">{characteristic.title}</p>
                        <p className="m-0 color-weak">{characteristic.characteristic}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface OnboardingPillProps {
    onClick: () => void;
}

const OnboardingPill = ({ onClick }: OnboardingPillProps) => {
    return (
        <div className="absolute bottom-0 right-0 mb-4 mr-4">
            <Button
                onClick={onClick}
                shape="outline"
                pill
                color="weak"
                className="inline-flex flex-row flex-nowrap gap-2 items-center"
            >
                <Icon name="lock-check-filled" className="color-primary" />
                <span className="color-weak text-sm">{c('collider_2025: Pill').t`Protected by ${BRAND_NAME}`}</span>
            </Button>
        </div>
    );
};

interface LumoMainTextProps {
    isOnboardingCompleted?: boolean;
    isSmallScreen: boolean;
    isGhostMode: boolean;
}

// Custom hook for encrypted text animation
const useEncryptedTextAnimation = (targetText: string, trigger: boolean, duration: number = 600) => {
    const [displayText, setDisplayText] = useState(targetText);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!trigger) {
            setDisplayText(targetText);
            return;
        }

        setIsAnimating(true);
        const chars = '0123456789ABCDEF'; // Simple hex characters
        const totalChars = targetText.length;

        const revealedChars = new Set<number>();
        const animationSteps = 15; // Much fewer steps for speed
        const stepDelay = duration / animationSteps;

        const animate = (step: number) => {
            if (step >= animationSteps) {
                setDisplayText(targetText);
                setIsAnimating(false);
                return;
            }

            // Linear progress for consistent speed
            const progress = step / animationSteps;
            const charsToReveal = Math.floor(progress * totalChars);

            // Reveal characters from left to right with some randomness
            while (revealedChars.size < charsToReveal && revealedChars.size < totalChars) {
                let nextChar = revealedChars.size;
                // Add slight randomness but keep mostly left-to-right
                if (Math.random() < 0.3 && nextChar + 1 < totalChars) {
                    nextChar = revealedChars.size + Math.floor(Math.random() * 2);
                }
                revealedChars.add(nextChar);
            }

            let newText = '';
            for (let i = 0; i < targetText.length; i++) {
                if (targetText[i] === ' ') {
                    newText += ' ';
                } else if (revealedChars.has(i)) {
                    newText += targetText[i];
                } else {
                    newText += chars[Math.floor(Math.random() * chars.length)];
                }
            }

            setDisplayText(newText);
            setTimeout(() => animate(step + 1), stepDelay);
        };

        animate(0);
    }, [targetText, trigger, duration]);

    return { displayText, isAnimating };
};

const LumoMainText = ({ isOnboardingCompleted, isSmallScreen, isGhostMode }: LumoMainTextProps) => {
    const [previousGhostMode, setPreviousGhostMode] = useState(isGhostMode);
    const shouldAnimate = isGhostMode !== previousGhostMode;

    useEffect(() => {
        setPreviousGhostMode(isGhostMode);
    }, [isGhostMode]);

    let targetText = '';
    if (isGhostMode) {
        targetText = c('collider_2025:Title').t`Ghost mode`;
    } else if (isSmallScreen) {
        targetText = c('collider_2025:Title').t`Hey, I'm ${LUMO_SHORT_APP_NAME}. Ask me anything. It's confidential.`;
    } else if (isOnboardingCompleted) {
        targetText = c('collider_2025:Title').t`Hello! How can I help you today?`;
    } else {
        targetText = c('collider_2025:Title').t`Hey, I'm ${LUMO_SHORT_APP_NAME}. Ask me anything. It's confidential.`;
    }

    const { displayText } = useEncryptedTextAnimation(targetText, shouldAnimate, 600);

    const textClassName = `main-text lh100 transition-all duration-50 ease-out  ${
        isSmallScreen ? 'text-wrap-balance text-center mx-auto' : isOnboardingCompleted ? '' : 'text-wrap-balance'
    }`;

    if (isGhostMode) {
        return (
            <div className="mx-auto md:mx-0">
                <h1 className={textClassName}>{displayText}</h1>
                <p className={clsx('color-weak text-lg md:text-xl', isSmallScreen && 'text-center')}>
                    {c('collider_2025:Title').t`This chat disappears when you close it and is never saved.`}
                </p>
            </div>
        );
    }

    if (isSmallScreen) {
        return <h1 className={textClassName}>{displayText}</h1>;
    }

    if (isOnboardingCompleted) {
        return <h1 className={`${textClassName} onboarded`}>{displayText}</h1>;
    }

    return <h1 className={textClassName}>{displayText}</h1>;
};

const MainContainer = ({
    handleSendMessage,
    isProcessingAttachment,
    isWebSearchButtonToggled,
    onToggleWebSearch,
}: {
    handleSendMessage: HandleSendMessage;
    isProcessingAttachment: boolean;
    isWebSearchButtonToggled: boolean;
    onToggleWebSearch: () => void;
}) => {
    const { isOnboardingCompleted, completeOnboarding } = useOnboardingContext();
    const onboardingModal = useModalStateObject({ onClose: () => completeOnboarding() });
    const { isSmallScreen } = useIsLumoSmallScreen();
    const filesContainerRef = useRef<HTMLDivElement>(null);
    const isGuest = useIsGuest();
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [isEditorEmpty, setIsEditorEmpty] = useState(true);

    // Files panel state
    const [openPanel, setOpenPanel] = useState<{
        type: 'files' | null;
        filterMessage?: Message;
        autoShowDriveBrowser?: boolean;
    }>({ type: null });
    const { isGhostChatMode } = useGhostChat();

    const onClick = () => onboardingModal.openModal(true);

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

    // Determine if lumo-welcome-section should be visible
    // Hide when input is active (has content) on small screens, always show on large screens
    const shouldShowWelcomeSection = !isSmallScreen || isEditorEmpty;

    return (
        <>
            {isSmallScreen && (
                <HeaderWrapper>
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
                        'flex flex-column-reverse md:flex-row w-full flex-nowrap px-8 relative lumo-welcome-section',
                        isSmallScreen && 'top-custom',
                        shouldShowWelcomeSection ? 'is-visible' : 'is-hidden'
                    )}
                    style={{
                        '--top-custom': isSmallScreen ? '-6rem' : undefined,
                    }}
                >
                    <div
                        className="main-text-container flex-1 my-auto flex relative"
                        // style={{ '--bottom-custom': '-1.1875rem' }}
                    >
                        <LumoMainText
                            isOnboardingCompleted={isOnboardingCompleted}
                            isSmallScreen={isSmallScreen}
                            isGhostMode={isGhostChatMode}
                        />
                    </div>
                    <div
                        className={clsx('shrink-0 mt-auto text-center relative', isSmallScreen && 'mx-auto')}
                        style={{ width: isSmallScreen ? 200 : 170, height: isSmallScreen ? 200 : 170 }}
                    >
                        <img
                            src={lumoGhost}
                            alt="Lumo ghost avatar"
                            className="absolute inset-0"
                            style={{
                                width: isSmallScreen ? 160 : 140,
                                height: 'auto',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                opacity: isGhostChatMode ? 1 : 0,
                                transition: 'opacity 300ms ease-out',
                                pointerEvents: isGhostChatMode ? 'auto' : 'none',
                                margin: isSmallScreen ? '0 auto' : '',
                            }}
                        />

                        <LottieView
                            alt="Lumo assistant avatar"
                            animationData={lumoCatWaiting}
                            loop={true}
                            className="absolute inset-0"
                            style={{
                                width: isSmallScreen ? 200 : 170,
                                height: isSmallScreen ? 200 : 170,
                                opacity: !isGhostChatMode ? 1 : 0,
                                transition: 'opacity 300ms ease-out',
                                pointerEvents: !isGhostChatMode ? 'auto' : 'none',
                                margin: isSmallScreen ? '0 auto' : '',
                            }}
                        />
                    </div>
                </div>

                <div className="md:px-4 w-full" style={{ marginTop: '-1.1875rem' }}>
                    <ComposerComponent
                        handleSendMessage={handleSendMessage}
                        isProcessingAttachment={isProcessingAttachment}
                        className="fixed bottom-0 md:static w-full z-20"
                        isWebSearchButtonToggled={isWebSearchButtonToggled}
                        onToggleWebSearch={onToggleWebSearch}
                        setIsEditorFocused={setIsEditorFocused}
                        isEditorFocused={isEditorFocused}
                        setIsEditorEmpty={setIsEditorEmpty}
                        handleOpenFiles={handleOpenFiles}
                        onShowDriveBrowser={handleShowDriveBrowser}
                        isGuest={isGuest}
                        isSmallScreen={isSmallScreen}
                    />
                </div>

                {!isSmallScreen &&
                    (!isOnboardingCompleted ? (
                        <OnboardingSection onClick={onClick} onClose={completeOnboarding} />
                    ) : (
                        <OnboardingPill onClick={onClick} />
                    ))}
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
            {onboardingModal.render && <OnboardingModal {...onboardingModal.modalProps} />}

            {/* Legal disclaimer for desktop - only shown in guest mode and before user starts typing */}
            {isGuest && !isSmallScreen && (
                <div className="fixed bottom-0 left-0 right-0 text-center py-5 z-10">
                    <p className="text-sm color-weak m-0">
                        {c('collider_2025: Legal disclaimer').t`By using ${LUMO_SHORT_APP_NAME}, you agree to our`}{' '}
                        <InlineLinkButton
                            className="text-sm color-weak text-underline"
                            onClick={() => window.open('https://lumo.proton.me/legal/terms', '_blank')}
                        >
                            {c('collider_2025: Legal link').t`Terms`}
                        </InlineLinkButton>{' '}
                        {c('collider_2025: Legal disclaimer').t`and`}{' '}
                        <InlineLinkButton
                            className="text-sm color-weak text-underline"
                            onClick={() => window.open('https://lumo.proton.me/legal/privacy', '_blank')}
                        >
                            {c('collider_2025: Legal link').t`Privacy Policy`}
                        </InlineLinkButton>
                        .
                    </p>
                </div>
            )}
        </>
    );
};

export default MainContainer;
