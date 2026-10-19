import { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

interface ArtifactPanelHostLayoutValue {
    mountEl: HTMLElement | null;
    isHostVisible: boolean;
    panelFlexBasisPct: number;
}

interface ArtifactPanelHostActionsValue {
    registerMountEl: (el: HTMLElement | null) => void;
    setHostVisible: (visible: boolean) => void;
    setPanelFlexBasisPct: (pct: number) => void;
    setManualArtifactEditActive: (active: boolean) => void;
    isManualArtifactEditActive: () => boolean;
}

const ArtifactPanelHostLayoutContext = createContext<ArtifactPanelHostLayoutValue | null>(null);
const ArtifactPanelHostActionsContext = createContext<ArtifactPanelHostActionsValue | null>(null);

export const ArtifactPanelHostProvider = ({ children }: { children: ReactNode }) => {
    const [mountEl, setMountEl] = useState<HTMLElement | null>(null);
    const [isHostVisible, setHostVisible] = useState(false);
    const [panelFlexBasisPct, setPanelFlexBasisPct] = useState(45);
    const manualArtifactEditActiveRef = useRef(false);

    const registerMountEl = useCallback((el: HTMLElement | null) => {
        setMountEl(el);
    }, []);

    const setManualArtifactEditActive = useCallback((active: boolean) => {
        manualArtifactEditActiveRef.current = active;
    }, []);

    const isManualArtifactEditActive = useCallback(() => {
        return manualArtifactEditActiveRef.current;
    }, []);

    const layoutValue = useMemo(() => {
        return {
            mountEl,
            isHostVisible,
            panelFlexBasisPct,
        };
    }, [mountEl, isHostVisible, panelFlexBasisPct]);

    const actionsValue = useMemo(() => {
        return {
            registerMountEl,
            setHostVisible,
            setPanelFlexBasisPct,
            setManualArtifactEditActive,
            isManualArtifactEditActive,
        };
    }, [registerMountEl, setManualArtifactEditActive, isManualArtifactEditActive]);

    return (
        <ArtifactPanelHostActionsContext.Provider value={actionsValue}>
            <ArtifactPanelHostLayoutContext.Provider value={layoutValue}>
                {children}
            </ArtifactPanelHostLayoutContext.Provider>
        </ArtifactPanelHostActionsContext.Provider>
    );
};

export const useArtifactPanelHostLayout = (): ArtifactPanelHostLayoutValue => {
    const ctx = useContext(ArtifactPanelHostLayoutContext);
    if (!ctx) {
        throw new Error('useArtifactPanelHostLayout must be used within ArtifactPanelHostProvider');
    }
    return ctx;
};

export const useOptionalArtifactPanelHostLayout = (): ArtifactPanelHostLayoutValue | null => {
    return useContext(ArtifactPanelHostLayoutContext);
};

export const useArtifactPanelHostActions = (): ArtifactPanelHostActionsValue => {
    const ctx = useContext(ArtifactPanelHostActionsContext);
    if (!ctx) {
        throw new Error('useArtifactPanelHostActions must be used within ArtifactPanelHostProvider');
    }
    return ctx;
};

export const useOptionalArtifactPanelHostActions = (): ArtifactPanelHostActionsValue | null => {
    return useContext(ArtifactPanelHostActionsContext);
};
