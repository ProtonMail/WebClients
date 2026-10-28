import type { ReactNode } from 'react';
import { createContext, memo, useContext, useEffect, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import useLumoInMail from '@proton/components/components/drawer/views/lumoAgent/useLumoInMail';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import useApiStatus from '@proton/components/hooks/useApiStatus';
import useLocalState from '@proton/components/hooks/useLocalState';
import useOnline from '@proton/components/hooks/useOnline';
import { selectComposersCount } from '@proton/mail-composer/store/composers/composerSelectors';
import { getLocalStorageUserDrawerKey, isAppInView } from '@proton/shared/lib/drawer/helpers';
import type { DrawerLocalStorageValue } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { getItem } from '@proton/shared/lib/helpers/storage';

import { useMailSelector } from '../../store/hooks';
import type { PublisherProps } from '../provider/PublishedProvider';
import { PublishedProvider } from '../provider/PublishedProvider';
import { usePublishToProvider } from '../provider/usePublishToProvider';
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

export interface LumoFloatingPanelValue {
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
    /** Detached only. */
    isCatDismissed: boolean;
    dismissCat: () => void;
}

const LumoFloatingPanelContext = createContext<LumoFloatingPanelValue | null>(null);

export const useLumoFloatingPanel = (): LumoFloatingPanelValue => {
    const value = useContext(LumoFloatingPanelContext);
    if (!value) {
        throw new Error('useLumoFloatingPanel must be used within LumoFloatingPanelProvider');
    }
    return value;
};

/** False while Lumo is off, and for the one render after it turns on, before the panel state is published. */
export const useHasLumoFloatingPanel = (): boolean => {
    return useContext(LumoFloatingPanelContext) !== null;
};

const getSurfaceModeKey = (userID: string) => {
    return `lumo-mail-surface-mode-${userID}`;
};

// The drawer reopens its last app on load, so a Lumo tab left there would otherwise sit beside the pet
const getIsLumoLastInDrawer = (userID: string) => {
    const stored = getItem(getLocalStorageUserDrawerKey(userID));
    if (!stored) {
        return false;
    }
    try {
        return (JSON.parse(stored) as DrawerLocalStorageValue).app === DRAWER_NATIVE_APPS.LUMO;
    } catch {
        return false;
    }
};

const LumoFloatingPanelBody = memo(function LumoFloatingPanelBody({ onValue }: PublisherProps<LumoFloatingPanelValue>) {
    const [user] = useUser();
    const [isLumoLastInDrawer] = useState(() => getIsLumoLastInDrawer(user.ID));
    const [isDetached, setIsDetached] = useLocalState(!isLumoLastInDrawer, getSurfaceModeKey(user.ID));
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [sideState, setSideState] = useState(INITIAL_PANEL_SIDE_STATE);
    const [cardWidth, setCardWidth] = useState(CARD_MIN_WIDTH);
    const [isCatHidden, setIsCatHidden] = useState(false);
    const [isCatDismissed, setIsCatDismissed] = useState(false);
    const hasComposers = useMailSelector(selectComposersCount) > 0;
    const { appInView, toggleDrawerApp, showDrawerSidebar } = useDrawer();
    const { assistantOpened } = useLumoMailTelemetry();
    const { offline } = useApiStatus();
    const isOnline = useOnline();
    // Mirrors useToggleDrawerApp, which silently refuses to open the drawer otherwise
    const canOpenDrawer = !offline && isOnline;

    useEffect(() => {
        setSideState(hasComposers ? composersOpened : composersClosed);
    }, [hasComposers]);

    // The sidebar button is the only visible way back from a dismiss, so hiding the sidebar brings the cat back
    useEffect(() => {
        if (!showDrawerSidebar) {
            setIsCatDismissed(false);
        }
    }, [showDrawerSidebar]);

    const toggleDrawer = toggleDrawerApp({ app: DRAWER_NATIVE_APPS.LUMO });
    const isCurrentSurfaceOpen = isDetached ? isPanelOpen : isAppInView(DRAWER_NATIVE_APPS.LUMO, appInView);

    const closePanel = () => {
        setIsPanelOpen(false);
    };

    const openPanelWithCat = () => {
        setIsPanelOpen(true);
        setIsCatHidden(false);
        setIsCatDismissed(false);
    };

    const detach = () => {
        toggleDrawer();
        setIsDetached(true);
        openPanelWithCat();
    };

    const dock = () => {
        if (!canOpenDrawer) {
            return;
        }
        setIsPanelOpen(false);
        setIsDetached(false);
        setIsCatDismissed(false);
        toggleDrawer();
    };

    const openLumo = () => {
        if (!isDetached && !canOpenDrawer) {
            return;
        }
        assistantOpened();
        if (isDetached) {
            openPanelWithCat();
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

    const dismissCat = () => {
        setIsPanelOpen(false);
        setIsCatDismissed(true);
    };

    const closeLumo = isDetached ? closePanel : toggleDrawer;

    const switchSides = () => {
        setSideState(switchPanelSides);
    };

    useLumoHotkey({ isCurrentSurfaceOpen, openLumo });

    const value: LumoFloatingPanelValue = {
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
        isCatDismissed,
        dismissCat,
    };

    usePublishToProvider(value, onValue);

    return null;
});

interface Props {
    children: ReactNode;
}

/** Held above the routes and the drawer, so the floating state survives a mailbox remount and a dock. */
export const LumoFloatingPanelProvider = ({ children }: Props) => {
    const isLumoInMailEnabled = useLumoInMail();

    return (
        <PublishedProvider
            context={LumoFloatingPanelContext}
            isEnabled={isLumoInMailEnabled}
            Publisher={LumoFloatingPanelBody}
        >
            {children}
        </PublishedProvider>
    );
};
