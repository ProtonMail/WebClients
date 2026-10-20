import type { CSSProperties, RefObject } from 'react';
import { Suspense, lazy } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';
import clsx from '@proton/utils/clsx';

import LumoPet from '../pet/LumoPet';
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
    const { isDetached, isPanelOpen, shownSide, cardWidth, setCardWidth, toggleLumo, closePanel, switchSides, dock } =
        useLumoFloatingPanel();
    const { clear } = useLumoAgentDrawer();
    const bounds = useMailboxBounds(mainAreaRef);
    const { viewportWidth } = useActiveBreakpoint();

    if (!isDetached || viewportWidth['<=small'] || !bounds) {
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

    const overlayStyle = {
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        '--lumo-floating-panel-width': `${bounds.width}px`,
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
            {isPanelOpen && (
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
            )}
            <div className="lumo-floating-panel-dock">
                <LumoPet
                    side={shownSide}
                    isPanelOpen={isPanelOpen}
                    actions={{
                        onToggle: toggleLumo,
                        onMove: switchSides,
                        onDock: dock,
                        onNewChat: startNewChat,
                    }}
                />
            </div>
        </div>
    );
};

export default LumoFloatingPanel;
