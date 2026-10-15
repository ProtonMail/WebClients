import type { CSSProperties, RefObject } from 'react';
import { Suspense, lazy } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';
import clsx from '@proton/utils/clsx';

import LumoFloatingPanelMenu from './LumoFloatingPanelMenu';
import { useLumoFloatingPanel } from './LumoFloatingPanelProvider';
import LumoFloatingPanelResizeEdge from './LumoFloatingPanelResizeEdge';
import { CARD_MIN_WIDTH, clampCardWidth } from './cardResize';
import { useMailboxBounds } from './useMailboxBounds';

import './LumoFloatingPanel.scss';

const LazyLumoFloatingPanelCard = lazy(() => import('./LumoFloatingPanelCard'));
const LazyConnectedLumoPromptBar = lazy(() => import('@proton/llm/lib/lumoAgent/ui/ConnectedLumoPromptBar'));

interface Props {
    mainAreaRef: RefObject<HTMLElement>;
    /** The rail is hidden, so its show button floats over the mailbox's bottom-right corner. */
    hasFloatingDrawerButton: boolean;
}

const LumoFloatingPanel = ({ mainAreaRef, hasFloatingDrawerButton }: Props) => {
    const { isDetached, isPanelOpen, shownSide, cardWidth, setCardWidth, closePanel, switchSides, dock } =
        useLumoFloatingPanel();
    const { hasConversation, clear, openDebugReport } = useLumoAgentDrawer();
    const bounds = useMailboxBounds(mainAreaRef);
    const { viewportWidth } = useActiveBreakpoint();

    if (!isDetached || !isPanelOpen || viewportWidth['<=small'] || !bounds) {
        return null;
    }

    const shownCardWidth = clampCardWidth(cardWidth, bounds.width);
    const resizeCard = (width: number) => {
        setCardWidth(clampCardWidth(width, bounds.width));
    };
    const resetCardWidth = () => {
        setCardWidth(CARD_MIN_WIDTH);
    };

    const overlayStyle = {
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        '--lumo-floating-panel-card-width': `${shownCardWidth}px`,
    } as CSSProperties;

    return (
        <div
            className={clsx(
                'lumo-floating-panel',
                `lumo-floating-panel--${shownSide}`,
                hasFloatingDrawerButton && 'lumo-floating-panel--drawer-button-clearance'
            )}
            style={overlayStyle}
        >
            <div id="drawer-app-lumo" className="lumo-floating-panel-chat">
                <div className="lumo-floating-panel-card-slot">
                    <Suspense fallback={<div className="lumo-floating-panel-card rounded-xl" />}>
                        <LazyLumoFloatingPanelCard onClose={closePanel} />
                    </Suspense>
                </div>
                <div className="lumo-floating-panel-prompt-slot">
                    <Suspense fallback={<div className="lumo-floating-panel-prompt-placeholder" />}>
                        <LazyConnectedLumoPromptBar onClose={closePanel} />
                    </Suspense>
                </div>
                <LumoFloatingPanelResizeEdge
                    side={shownSide}
                    cardWidth={shownCardWidth}
                    onResize={resizeCard}
                    onReset={resetCardWidth}
                />
            </div>
            <LumoFloatingPanelMenu
                side={shownSide}
                hasConversation={hasConversation}
                onReportProblem={openDebugReport}
                onNewChat={clear}
                onSwitchSides={switchSides}
                onDock={dock}
            />
        </div>
    );
};

export default LumoFloatingPanel;
