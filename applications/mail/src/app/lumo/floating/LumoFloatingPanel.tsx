import type { CSSProperties, RefObject, TransitionEvent } from 'react';
import { Suspense, lazy, useEffect, useState } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useReducedMotion } from '@proton/components/hooks/useReducedMotion';
import useRightToLeft from '@proton/hooks/useRightToLeft';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import LumoPet from '../pet/LumoPet';
import { matchCatTrick } from '../pet/catTricks';
import { useCatMotion } from '../pet/useCatMotion';
import { useTypingActivity } from '../pet/useTypingActivity';
import { useLumoFloatingPanel } from './LumoFloatingPanelProvider';
import LumoFloatingPanelResizeEdge from './LumoFloatingPanelResizeEdge';
import { CARD_MIN_WIDTH, clampCardWidth } from './cardResize';
import { useMailboxBounds } from './useMailboxBounds';
import { usePanelDrag } from './usePanelDrag';

import './LumoFloatingPanel.scss';

const LazyLumoFloatingPanelCard = lazy(() => import('./LumoFloatingPanelCard'));
const LazyConnectedLumoPromptBar = lazy(() => import('@proton/llm/lib/lumoAgent/ui/ConnectedLumoPromptBar'));

// In rem, mirroring $cat-inset, $cat-size and $drawer-button-clearance, so the run scales with the font size
const INSET_REM = 1;
const CAT_SIZE_REM = 6;
const DRAWER_BUTTON_CLEARANCE_REM = 2;
const RUN_PX_PER_SECOND = 600;
const RUN_MAX_MS = 1500;
const UNMEASURED_BOUNDS = { left: 0, width: 0 };

const getRunMs = (boundsWidth: number, hasFloatingDrawerButton: boolean) => {
    const clearanceRem = hasFloatingDrawerButton ? DRAWER_BUTTON_CLEARANCE_REM : 0;
    const distance = boundsWidth - (2 * INSET_REM + CAT_SIZE_REM + clearanceRem) * rootFontSize();
    return Math.min(RUN_MAX_MS, (Math.max(distance, 0) / RUN_PX_PER_SECOND) * 1000);
};

interface Props {
    mainAreaRef: RefObject<HTMLElement>;
    /** The rail is hidden, so its show button floats over the mailbox's bottom-right corner. */
    hasFloatingDrawerButton: boolean;
}

const LumoFloatingPanel = ({ mainAreaRef, hasFloatingDrawerButton }: Props) => {
    const {
        isDetached,
        isPanelOpen,
        shownSide,
        cardWidth,
        setCardWidth,
        toggleLumo,
        closePanel,
        switchSides,
        dock,
        isCatHidden,
        hideCat,
        revealCat,
        isCatDismissed,
    } = useLumoFloatingPanel();
    const { clear } = useLumoAgentDrawer();
    const bounds = useMailboxBounds(mainAreaRef);
    const { viewportWidth } = useActiveBreakpoint();
    const isReducedMotion = useReducedMotion();
    const { isTyping, noteKeystroke } = useTypingActivity();
    const [isRTL] = useRightToLeft();
    const [isSnapping, setIsSnapping] = useState(false);
    const isHiddenByLayout = !isDetached || isCatDismissed || viewportWidth['<=small'] || !bounds;
    // Off screen nobody sees a run or a jump, so the cat comes back sitting
    const canJump = !isReducedMotion && !isHiddenByLayout;
    const runMs = bounds ? getRunMs(bounds.width, hasFloatingDrawerButton) : 0;
    const {
        shownSide: runShownSide,
        motion,
        endGlide,
        endJump,
        playTrick,
    } = useCatMotion({ side: shownSide, isCatHidden, canJump, runMs, isSnapping });
    const { startDrag, targetSide, isOverTarget } = usePanelDrag({
        bounds: bounds ?? UNMEASURED_BOUNDS,
        shownSide,
        isRTL,
        isEnabled: isPanelOpen && !isHiddenByLayout,
        onDrop: () => {
            setIsSnapping(true);
            switchSides();
        },
    });

    // Held until the cat has landed on the dropped side, so the next Move gallops again
    const hasSnapLanded = isSnapping && runShownSide === shownSide;
    useEffect(() => {
        if (hasSnapLanded) {
            setIsSnapping(false);
        }
    }, [hasSnapLanded]);

    if (isHiddenByLayout) {
        return null;
    }

    const shownCardWidth = clampCardWidth(cardWidth, bounds.width);
    const resizeCard = (width: number) => {
        setCardWidth(clampCardWidth(width, bounds.width));
    };
    const resetCardWidth = () => {
        setCardWidth(CARD_MIN_WIDTH);
    };
    const startNewChat = () => {
        clear();
        if (!isPanelOpen) {
            toggleLumo();
        }
    };
    const interceptTrickPhrase = (message: string) => {
        const matchedTrick = matchCatTrick(message);
        if (!matchedTrick) {
            return false;
        }
        playTrick(matchedTrick);
        return true;
    };

    const handleRunEnd = (event: TransitionEvent) => {
        if (event.target === event.currentTarget && event.propertyName === 'transform') {
            endGlide();
        }
    };

    const overlayStyle = {
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        '--lumo-floating-panel-width': `${bounds.width}px`,
        '--lumo-floating-panel-run-ms': `${runMs}ms`,
        '--lumo-floating-panel-card-width': `${shownCardWidth}px`,
    } as CSSProperties;

    return (
        <div
            className={clsx(
                'lumo-floating-panel',
                `lumo-floating-panel--${runShownSide}`,
                hasFloatingDrawerButton && 'lumo-floating-panel--drawer-button-clearance',
                motion.run && 'lumo-floating-panel--running'
            )}
            style={overlayStyle}
        >
            {isPanelOpen && (
                <div id="drawer-app-lumo" className="lumo-floating-panel-chat">
                    {targetSide && (
                        <div
                            className={clsx(
                                'lumo-floating-panel-drop-target rounded-xl',
                                `lumo-floating-panel-drop-target--${targetSide}`,
                                isOverTarget && 'lumo-floating-panel-drop-target--active'
                            )}
                        />
                    )}
                    <div className="lumo-floating-panel-card-slot">
                        <Suspense fallback={<div className="lumo-floating-panel-card rounded-xl" />}>
                            <LazyLumoFloatingPanelCard onClose={closePanel} />
                        </Suspense>
                        <div
                            className="lumo-floating-panel-drag-handle absolute top-0 left-0 w-full h-4 flex items-center justify-center cursor-move"
                            aria-hidden="true"
                            data-testid="lumo-floating-panel-drag-handle"
                            onMouseDown={startDrag}
                        >
                            <span className="lumo-floating-panel-drag-handle-dots mt-1" />
                        </div>
                    </div>
                    <div className="lumo-floating-panel-prompt-slot">
                        <Suspense fallback={<div className="lumo-floating-panel-prompt-placeholder" />}>
                            <LazyConnectedLumoPromptBar
                                onClose={closePanel}
                                onDraftChange={noteKeystroke}
                                interceptSend={interceptTrickPhrase}
                            />
                        </Suspense>
                    </div>
                    <LumoFloatingPanelResizeEdge
                        side={runShownSide}
                        cardWidth={shownCardWidth}
                        onResize={resizeCard}
                        onReset={resetCardWidth}
                    />
                </div>
            )}
            <div className="lumo-floating-panel-dock" onTransitionEnd={handleRunEnd}>
                <LumoPet
                    side={runShownSide}
                    isPanelOpen={isPanelOpen}
                    isTyping={isTyping}
                    motion={motion}
                    actions={{
                        onToggle: toggleLumo,
                        onMove: switchSides,
                        onDock: dock,
                        onNewChat: startNewChat,
                        onHide: hideCat,
                        onReveal: revealCat,
                    }}
                    onJumpEnd={endJump}
                />
            </div>
        </div>
    );
};

export default LumoFloatingPanel;
