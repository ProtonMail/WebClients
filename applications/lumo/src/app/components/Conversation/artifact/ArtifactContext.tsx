import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { Message } from '../../../types';
import type { ArtifactRegistry } from './artifactRegistry';
import type { ParsedArtifact, StreamingArtifact } from './parseArtifacts';
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
    // In-progress artifact being streamed — renders as plain text preview
    streamingArtifact: StreamingArtifact | null;
    setStreamingArtifact: (artifact: StreamingArtifact | null) => void;
    // A create_artifact tool call that has fully parsed (real title/type/content available)
    // but whose message hasn't finished generating yet, so it isn't in `registry` yet either.
    // Lets the panel/chip show and open real content immediately instead of waiting for the
    // message to finish, without needing a version index from the (not-yet-updated) registry.
    pendingArtifact: ParsedArtifact | null;
    setPendingArtifact: (artifact: ParsedArtifact | null) => void;
    // Focuses the panel on `pendingArtifact` even if a different artifact is currently selected.
    openPendingArtifact: () => void;
    // True when any artifact is present (controls panel visibility)
    isPanelOpen: boolean;
    closePanel: () => void;
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
    const [streamingArtifact, setStreamingArtifact] = useState<StreamingArtifact | null>(null);
    const [pendingArtifact, setPendingArtifact] = useState<ParsedArtifact | null>(null);
    const [seenVersionKeys, setSeenVersionKeys] = useState<Set<string>>(new Set());
    const prevVersionCountsRef = useRef<Record<string, number>>({});

    const openPendingArtifact = useCallback(() => {
        setSelectedId(null);
    }, []);

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
        setStreamingArtifact(null);
        setPendingArtifact(null);
    }, []);

    // Reset all state when navigating to a different conversation
    useEffect(() => {
        closePanel();
        setSeenVersionKeys(new Set());
        prevVersionCountsRef.current = {};
    }, [conversationId, closePanel]);

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

    return (
        <ArtifactContext.Provider
            value={{
                registry,
                selectedArtifact,
                selectedId,
                selectedVersionIndex,
                openArtifact,
                goToVersion,
                hasUnseenRevision,
                streamingArtifact,
                setStreamingArtifact,
                pendingArtifact,
                setPendingArtifact,
                openPendingArtifact,
                isPanelOpen: selectedArtifact !== null || streamingArtifact !== null || pendingArtifact !== null,
                closePanel,
            }}
        >
            {children}
        </ArtifactContext.Provider>
    );
};

export const useArtifactContext = (): ArtifactContextValue => {
    const ctx = useContext(ArtifactContext);
    if (!ctx) {
        throw new Error('useArtifactContext must be used within ArtifactProvider');
    }
    return ctx;
};
