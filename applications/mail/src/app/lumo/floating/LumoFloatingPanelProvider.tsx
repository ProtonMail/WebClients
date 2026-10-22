import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import useLocalState from '@proton/components/hooks/useLocalState';
import useOnline from '@proton/components/hooks/useOnline';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import { selectComposersCount } from '../../store/composers/composerSelectors';
import { useMailSelector } from '../../store/hooks';
import { useLumoMailTelemetry } from '../telemetry/useLumoMailTelemetry';
import { CARD_MIN_WIDTH } from './cardResize';
import type { PanelSide } from './panelSide';
import {
    INITIAL_PANEL_SIDE_STATE,
    composersClosed,
    composersOpened,
    getShownSide,
    switchSides as switchPanelSides,
} from './panelSide';
import { useLumoHotkey } from './useLumoHotkey';

interface LumoFloatingPanelValue {
    isDetached: boolean;
    isPanelOpen: boolean;
    isCurrentSurfaceOpen: boolean;
    shownSide: PanelSide;
    cardWidth: number;
    setCardWidth: (width: number) => void;
    detach: () => void;
    dock: () => void;
    toggleLumo: () => void;
    closePanel: () => void;
    switchSides: () => void;
    isCatHidden: boolean;
    hideCat: () => void;
    revealCat: () => void;
}

const LumoFloatingPanelContext = createContext<LumoFloatingPanelValue | null>(null);

export const useLumoFloatingPanel = (): LumoFloatingPanelValue => {
    const value = useContext(LumoFloatingPanelContext);
    if (!value) {
        throw new Error('useLumoFloatingPanel must be used within LumoFloatingPanelProvider');
    }
    return value;
};

interface Props {
    children: ReactNode;
}

const getSurfaceModeKey = (userID: string) => {
    return `lumo-mail-surface-mode-${userID}`;
};

/** Held above the routes and the drawer, so the floating state survives a mailbox remount and a dock. */
export const LumoFloatingPanelProvider = ({ children }: Props) => {
    const [user] = useUser();
    const [isDetached, setIsDetached] = useLocalState(false, getSurfaceModeKey(user.ID));
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [sideState, setSideState] = useState(INITIAL_PANEL_SIDE_STATE);
    const [cardWidth, setCardWidth] = useState(CARD_MIN_WIDTH);
    const [isCatHidden, setIsCatHidden] = useState(false);
    const hasComposers = useMailSelector(selectComposersCount) > 0;
    const { appInView, toggleDrawerApp } = useDrawer();
    const { assistantOpened } = useLumoMailTelemetry();
    const { offline } = useApiStatus();
    const isOnline = useOnline();
    // Mirrors useToggleDrawerApp, which silently refuses to open the drawer otherwise
    const canOpenDrawer = !offline && isOnline;

    useEffect(() => {
        setSideState(hasComposers ? composersOpened : composersClosed);
    }, [hasComposers]);

    const toggleDrawer = toggleDrawerApp({ app: DRAWER_NATIVE_APPS.LUMO });
    const isCurrentSurfaceOpen = isDetached ? isPanelOpen : isAppInView(DRAWER_NATIVE_APPS.LUMO, appInView);

    const closePanel = () => {
        setIsPanelOpen(false);
    };

    const detach = () => {
        toggleDrawer();
        setIsDetached(true);
        setIsPanelOpen(true);
        setIsCatHidden(false);
    };

    const dock = () => {
        if (!canOpenDrawer) {
            return;
        }
        setIsPanelOpen(false);
        setIsDetached(false);
        toggleDrawer();
    };

    const openLumo = () => {
        if (!isDetached && !canOpenDrawer) {
            return;
        }
        assistantOpened();
        if (isDetached) {
            setIsPanelOpen(true);
            setIsCatHidden(false);
            return;
        }
        toggleDrawer();
    };

    const hideCat = () => {
        setIsPanelOpen(false);
        setIsCatHidden(true);
    };

    const revealCat = () => {
        setIsCatHidden(false);
    };

    const closeLumo = isDetached ? closePanel : toggleDrawer;

    const switchSides = () => {
        setSideState(switchPanelSides);
    };

    useLumoHotkey({ isCurrentSurfaceOpen, openLumo });

    return (
        <LumoFloatingPanelContext.Provider
            value={{
                isDetached,
                isPanelOpen,
                isCurrentSurfaceOpen,
                shownSide: getShownSide(sideState),
                cardWidth,
                setCardWidth,
                detach,
                dock,
                toggleLumo: isCurrentSurfaceOpen ? closeLumo : openLumo,
                closePanel,
                switchSides,
                isCatHidden,
                hideCat,
                revealCat,
            }}
        >
            {children}
        </LumoFloatingPanelContext.Provider>
    );
};
