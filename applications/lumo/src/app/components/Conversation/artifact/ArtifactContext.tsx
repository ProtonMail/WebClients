import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { Message } from '../../../types';
import type { ArtifactRegistry } from './artifactRegistry';
import { isArtifactVersionProvisional } from './artifactRegistry';
import type { ParsedArtifact } from './parseArtifacts';
import { useArtifactRegistry } from './useArtifactRegistry';

interface ArtifactContextValue {
    // All artifacts seen anywhere on the active linear chain, keyed by artifact id, each
    // holding one version per finalized assistant message that reused that id.
    registry: ArtifactRegistry;
    // The artifact + version currently shown in the panel, or null when nothing is open.
    selectedArtifact: ParsedArtifact | null;
    selectedId: string | null;
    selectedVersionIndex: number;
    // Opens an artifact by id, defaulting to its latest version.
    openArtifact: (id: string, versionIndex?: number) => void;
    goToVersion: (index: number) => void;
    hasUnseenRevision: (id: string) => boolean;
    // True when any artifact is present (controls panel visibility)
    isPanelOpen: boolean;
    closePanel: () => void;
    // Set when the user explicitly closes the panel; suppresses auto-open for the current generation.
    panelUserClosed: boolean;
    resetPanelUserClosed: () => void;
    isSelectedVersionProvisional: boolean;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

interface ArtifactProviderProps {
    children: ReactNode;
    conversationId?: string;
    linearChain: Message[];
}

export const ArtifactProvider = ({ children, conversationId, linearChain }: ArtifactProviderProps) => {
    const registry = useArtifactRegistry(linearChain);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
    const [panelUserClosed, setPanelUserClosed] = useState(false);
    const [seenVersionKeys, setSeenVersionKeys] = useState<Set<string>>(new Set());
    const prevVersionCountsRef = useRef<Record<string, number>>({});

    const markSeen = useCallback((id: string, versionIndex: number) => {
        const key = `${id}:${versionIndex}`;
        setSeenVersionKeys((prev) => {
            if (prev.has(key)) {
                return prev;
            }
            const next = new Set(prev);
            next.add(key);
            return next;
        });
    }, []);

    const closePanel = useCallback(() => {
        setSelectedId(null);
        setSelectedVersionIndex(0);
        setPanelUserClosed(true);
    }, []);

    const resetPanelUserClosed = useCallback(() => {
        setPanelUserClosed(false);
    }, []);

    // Reset all state when navigating to a different conversation
    useEffect(() => {
        setSelectedId(null);
        setSelectedVersionIndex(0);
        setPanelUserClosed(false);
        setSeenVersionKeys(new Set());
        prevVersionCountsRef.current = {};
    }, [conversationId]);

    const openArtifact = useCallback(
        (id: string, versionIndex?: number) => {
            const entry = registry[id];
            if (!entry) {
                return;
            }
            const latestIndex = entry.versions.length - 1;
            const index = versionIndex === undefined ? latestIndex : Math.min(Math.max(versionIndex, 0), latestIndex);
            setSelectedId(id);
            setSelectedVersionIndex(index);
            setPanelUserClosed(false);
            markSeen(id, index);
        },
        [registry, markSeen]
    );

    const goToVersion = useCallback(
        (index: number) => {
            if (!selectedId) {
                return;
            }
            const entry = registry[selectedId];
            if (!entry) {
                return;
            }
            const clamped = Math.min(Math.max(index, 0), entry.versions.length - 1);
            setSelectedVersionIndex(clamped);
            markSeen(selectedId, clamped);
        },
        [selectedId, registry, markSeen]
    );

    const hasUnseenRevision = useCallback(
        (id: string) => {
            const entry = registry[id];
            if (!entry) {
                return false;
            }
            return !seenVersionKeys.has(`${id}:${entry.versions.length - 1}`);
        },
        [registry, seenVersionKeys]
    );

    // Keep the panel in sync with the registry: follow new versions of the artifact the
    // user is currently viewing (only if they were already at the latest version), and
    // close the panel if the selected artifact fell off the active branch (e.g. regenerate).
    useEffect(() => {
        if (selectedId) {
            const entry = registry[selectedId];
            if (!entry) {
                setSelectedId(null);
                setSelectedVersionIndex(0);
            } else {
                const prevCount = prevVersionCountsRef.current[selectedId] ?? entry.versions.length;
                const wasViewingLatest = selectedVersionIndex === prevCount - 1;
                if (entry.versions.length > prevCount && wasViewingLatest) {
                    const latestIndex = entry.versions.length - 1;
                    setSelectedVersionIndex(latestIndex);
                    markSeen(selectedId, latestIndex);
                }
            }
        }

        const counts: Record<string, number> = {};
        Object.values(registry).forEach((entry) => {
            counts[entry.id] = entry.versions.length;
        });
        prevVersionCountsRef.current = counts;
        // Only re-run when the registry itself changes — selectedId/selectedVersionIndex
        // are read from refs/closure to avoid re-running this sync on every navigation.
    }, [registry]);

    const selectedEntry = selectedId ? registry[selectedId] : undefined;
    const selectedVersion = selectedEntry?.versions[selectedVersionIndex];
    const selectedArtifact: ParsedArtifact | null =
        selectedEntry && selectedVersion
            ? {
                  id: selectedEntry.id,
                  type: selectedEntry.type,
                  title: selectedEntry.title,
                  language: selectedVersion.language ?? selectedEntry.language,
                  content: selectedVersion.content,
              }
            : null;

    const isSelectedVersionProvisional =
        selectedId !== null && isArtifactVersionProvisional(registry, selectedId, selectedVersionIndex);

    const value = useMemo(
        () => ({
            registry,
            selectedArtifact,
            selectedId,
            selectedVersionIndex,
            openArtifact,
            goToVersion,
            hasUnseenRevision,
            isPanelOpen: selectedArtifact !== null,
            closePanel,
            panelUserClosed,
            resetPanelUserClosed,
            isSelectedVersionProvisional,
        }),
        [
            registry,
            selectedArtifact,
            selectedId,
            selectedVersionIndex,
            openArtifact,
            goToVersion,
            hasUnseenRevision,
            closePanel,
            panelUserClosed,
            resetPanelUserClosed,
            isSelectedVersionProvisional,
        ]
    );

    return <ArtifactContext.Provider value={value}>{children}</ArtifactContext.Provider>;
};

export const useArtifactContext = (): ArtifactContextValue => {
    const ctx = useContext(ArtifactContext);
    if (!ctx) {
        throw new Error('useArtifactContext must be used within ArtifactProvider');
    }
    return ctx;
};
