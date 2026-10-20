import type { CSSProperties, RefObject, TransitionEvent } from 'react';
import { Suspense, lazy } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useReducedMotion } from '@proton/components/hooks/useReducedMotion';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import LumoPet from '../pet/LumoPet';
import { useCatMotion } from '../pet/useCatMotion';
import { useTypingActivity } from '../pet/useTypingActivity';
import { useLumoFloatingPanel } from './LumoFloatingPanelProvider';
import LumoFloatingPanelResizeEdge from './LumoFloatingPanelResizeEdge';
import { CARD_MIN_WIDTH, clampCardWidth } from './cardResize';
import { useMailboxBounds } from './useMailboxBounds';

import './LumoFloatingPanel.scss';

const LazyLumoFloatingPanelCard = lazy(() => import('./LumoFloatingPanelCard'));
const LazyConnectedLumoPromptBar = lazy(() => import('@proton/llm/lib/lumoAgent/ui/ConnectedLumoPromptBar'));

// In rem, mirroring $cat-inset, $cat-size and $drawer-button-clearance, so the run scales with the font size
const INSET_REM = 1;
const CAT_SIZE_REM = 6;
const DRAWER_BUTTON_CLEARANCE_REM = 2;
const RUN_PX_PER_SECOND = 600;
const RUN_MAX_MS = 1500;

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
    } = useLumoFloatingPanel();
    const { clear } = useLumoAgentDrawer();
    const bounds = useMailboxBounds(mainAreaRef);
    const { viewportWidth } = useActiveBreakpoint();
    const isReducedMotion = useReducedMotion();
    const { isTyping, noteKeystroke } = useTypingActivity();
    const isHiddenByLayout = !isDetached || viewportWidth['<=small'] || !bounds;
    // Off screen nobody sees a run or a jump, so the cat comes back sitting
    const canJump = !isReducedMotion && !isHiddenByLayout;
    const runMs = bounds ? getRunMs(bounds.width, hasFloatingDrawerButton) : 0;
    const {
        shownSide: runShownSide,
        motion,
        endGlide,
        endJump,
    } = useCatMotion({ side: shownSide, isCatHidden, canJump, runMs });

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
                    <div className="lumo-floating-panel-card-slot">
                        <Suspense fallback={<div className="lumo-floating-panel-card rounded-xl" />}>
                            <LazyLumoFloatingPanelCard onClose={closePanel} />
                        </Suspense>
                    </div>
                    <div className="lumo-floating-panel-prompt-slot">
                        <Suspense fallback={<div className="lumo-floating-panel-prompt-placeholder" />}>
                            <LazyConnectedLumoPromptBar onClose={closePanel} onDraftChange={noteKeystroke} />
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
