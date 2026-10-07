import {
    type ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { getMessageBlocks } from '../../../messageHelpers';
import type { Message } from '../../../types';
import { Role } from '../../../types-api';
import {
    type ArtifactPanelOpenSource,
    bucketArtifactPanelOpenDuration,
    capArtifactPosition,
    sendArtifactCreatedEvent,
    sendArtifactPanelClosedEvent,
    sendArtifactPanelOpenedEvent,
    sendArtifactRevisedEvent,
} from '../../../util/telemetry';
import {
    isArtifactGenerationLoading,
    isArtifactPanelGenerationLoading,
    isArtifactRevisionLoading,
} from './artifactGenerationState';
import type { ArtifactRegistry } from './artifactRegistry';
import { getArtifactVersionIndexForMessage, isArtifactVersionProvisional } from './artifactRegistry';
import {
    collectArtifactVersionTelemetry,
    consumeArtifactTelemetryLiveMessages,
    getArtifactTelemetryLiveMessages,
} from './artifactVersionTelemetry';
import { extractCompleteArtifactsFromBlocks } from './createArtifactTool';
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
    // Opens an artifact by id; `versionIndex` undefined means its latest version.
    openArtifact: (id: string, versionIndex: number | undefined, source: ArtifactPanelOpenSource) => void;
    goToVersion: (index: number) => void;
    hasUnseenRevision: (id: string) => boolean;
    // True when any artifact is present (controls panel visibility)
    isPanelOpen: boolean;
    closePanel: () => void;
    isFullscreen: boolean;
    enterFullscreen: () => void;
    exitFullscreen: () => void;
    // Set when the user explicitly closes the panel; suppresses auto-open for the current generation.
    panelUserClosed: boolean;
    resetPanelUserClosed: () => void;
    isSelectedVersionProvisional: boolean;
    isArtifactGenerationLoading: boolean;
    isArtifactRevisionLoading: boolean;
    isLoadingPanelOpen: boolean;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

interface ArtifactProviderProps {
    children: ReactNode;
    conversationId?: string;
    linearChain: Message[];
    isGenerating?: boolean;
}

export const ArtifactProvider = ({
    children,
    conversationId,
    linearChain,
    isGenerating = false,
}: ArtifactProviderProps) => {
    const registry = useArtifactRegistry(linearChain);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
    const [panelUserClosed, setPanelUserClosed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [seenVersionKeys, setSeenVersionKeys] = useState<Set<string>>(new Set());
    const prevVersionCountsRef = useRef<Record<string, number>>({});
    const selectedVersionIndexRef = useRef(selectedVersionIndex);
    selectedVersionIndexRef.current = selectedVersionIndex;
    // Telemetry only: read from the open/close callbacks without re-creating them.
    const selectedIdRef = useRef(selectedId);
    selectedIdRef.current = selectedId;
    const registryRef = useRef(registry);
    registryRef.current = registry;
    const isLoadingPanelOpenRef = useRef(false);
    const panelOpenedAtRef = useRef<number | null>(null);
    // Tracks the in-flight assistant message so auto-open applies only to the current generation.
    const inFlightAssistantMessageIdRef = useRef<string | null>(null);

    const lastMessage = linearChain.at(-1);
    const parentUserMessage = useMemo(() => {
        if (!lastMessage?.parentId) {
            return undefined;
        }

        const parent = linearChain.find((message) => {
            return message.id === lastMessage.parentId;
        });

        if (!parent || parent.role !== Role.User) {
            return undefined;
        }

        return parent;
    }, [lastMessage?.parentId, linearChain]);

    const lastAssistantBlocks = useMemo(() => {
        if (!lastMessage || lastMessage.role !== Role.Assistant) {
            return [];
        }

        return getMessageBlocks(lastMessage);
    }, [lastMessage?.id, lastMessage?.blocks, lastMessage?.toolCall, lastMessage?.content, lastMessage?.role]);

    // Set synchronously during render (not in an effect) so auto-open logic below doesn't lag a
    // tick behind the generation actually starting.
    if (isGenerating && lastMessage?.role === Role.Assistant) {
        inFlightAssistantMessageIdRef.current = lastMessage.id;
    }

    const lastAssistantCompleteArtifacts = useMemo(() => {
        return extractCompleteArtifactsFromBlocks(lastAssistantBlocks);
    }, [lastAssistantBlocks]);

    const artifactGenerationLoading = useMemo(() => {
        if (!lastMessage || lastMessage.role !== Role.Assistant) {
            return false;
        }

        return isArtifactGenerationLoading({
            isGenerating,
            isLastMessage: true,
            completeArtifacts: lastAssistantCompleteArtifacts,
            blocks: lastAssistantBlocks,
            parentUserMessage,
        });
    }, [lastMessage, isGenerating, parentUserMessage, lastAssistantBlocks, lastAssistantCompleteArtifacts]);

    const artifactPanelGenerationLoading = useMemo(() => {
        if (!lastMessage || lastMessage.role !== Role.Assistant) {
            return false;
        }

        return isArtifactPanelGenerationLoading({
            isGenerating,
            isLastMessage: true,
            completeArtifacts: lastAssistantCompleteArtifacts,
            blocks: lastAssistantBlocks,
            parentUserMessage,
        });
    }, [lastMessage, isGenerating, parentUserMessage, lastAssistantBlocks, lastAssistantCompleteArtifacts]);

    // Not gated on `isGenerating` — a complete artifact should open (and be shown live) the
    // moment its tool call resolves, without waiting for the rest of the assistant's turn.
    const pendingArtifactPanelOpen = useMemo(() => {
        if (panelUserClosed || selectedId !== null || !lastMessage || lastMessage.role !== Role.Assistant) {
            return false;
        }

        if (inFlightAssistantMessageIdRef.current !== lastMessage.id) {
            return false;
        }

        const artifact = lastAssistantCompleteArtifacts[0];
        if (!artifact) {
            return false;
        }

        const versionIndex = getArtifactVersionIndexForMessage(registry, artifact.id, lastMessage.id);
        return versionIndex !== null;
    }, [panelUserClosed, selectedId, lastMessage, lastAssistantCompleteArtifacts, registry]);

    const artifactRevisionLoading = useMemo(() => {
        if (!lastMessage || lastMessage.role !== Role.Assistant) {
            return false;
        }

        return isArtifactRevisionLoading({
            isGenerating,
            isLastMessage: true,
            completeArtifacts: lastAssistantCompleteArtifacts,
            blocks: lastAssistantBlocks,
            parentUserMessage,
            selectedId,
            selectedVersionIndex,
            registry,
        });
    }, [
        lastMessage,
        isGenerating,
        parentUserMessage,
        lastAssistantBlocks,
        lastAssistantCompleteArtifacts,
        selectedId,
        selectedVersionIndex,
        registry,
    ]);

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
        const closedEntry = selectedIdRef.current ? registryRef.current[selectedIdRef.current] : undefined;
        if (closedEntry) {
            sendArtifactPanelClosedEvent({
                closedDuringLoading: false,
                artifactType: closedEntry.type,
                openDurationBucket: bucketArtifactPanelOpenDuration(
                    panelOpenedAtRef.current === null ? 0 : Date.now() - panelOpenedAtRef.current
                ),
            });
        } else if (isLoadingPanelOpenRef.current) {
            sendArtifactPanelClosedEvent({ closedDuringLoading: true });
        }
        panelOpenedAtRef.current = null;
        setSelectedId(null);
        setSelectedVersionIndex(0);
        setPanelUserClosed(true);
        setIsFullscreen(false);
    }, []);

    const enterFullscreen = useCallback(() => {
        setIsFullscreen(true);
    }, []);

    const exitFullscreen = useCallback(() => {
        setIsFullscreen(false);
    }, []);

    const resetPanelUserClosed = useCallback(() => {
        setPanelUserClosed(false);
    }, []);

    // Reset all state when navigating to a different conversation
    useEffect(() => {
        setSelectedId(null);
        setSelectedVersionIndex(0);
        setPanelUserClosed(false);
        setIsFullscreen(false);
        setSeenVersionKeys(new Set());
        prevVersionCountsRef.current = {};
        inFlightAssistantMessageIdRef.current = null;
        panelOpenedAtRef.current = null;
    }, [conversationId]);

    const isLoadingPanelOpen = !panelUserClosed && selectedId === null && artifactPanelGenerationLoading;
    isLoadingPanelOpenRef.current = isLoadingPanelOpen;

    // Creation/revision telemetry: only versions produced by a generation or manual edit started in
    // this tab are reported (see `artifactVersionTelemetry.ts`), never history re-derived on load.
    useEffect(() => {
        const { events, consumedMessageIds } = collectArtifactVersionTelemetry(
            registry,
            linearChain,
            getArtifactTelemetryLiveMessages()
        );

        consumeArtifactTelemetryLiveMessages(consumedMessageIds);

        for (const event of events) {
            if (event.kind === 'created') {
                sendArtifactCreatedEvent(event.payload);
            } else {
                sendArtifactRevisedEvent(event.payload);
            }
        }
    }, [registry, linearChain]);

    const openArtifact = useCallback(
        (id: string, versionIndex: number | undefined, source: ArtifactPanelOpenSource) => {
            const entry = registry[id];
            if (!entry) {
                return;
            }
            const latestIndex = entry.versions.length - 1;
            const index = versionIndex === undefined ? latestIndex : Math.min(Math.max(versionIndex, 0), latestIndex);
            // Re-selecting the artifact already shown (e.g. a chip for another of its versions) isn't an open.
            if (selectedIdRef.current !== id) {
                if (selectedIdRef.current === null) {
                    panelOpenedAtRef.current = Date.now();
                }
                sendArtifactPanelOpenedEvent({
                    source,
                    artifactType: entry.type,
                    artifactPosition: capArtifactPosition(Object.keys(registry).indexOf(id) + 1),
                });
            }
            setSelectedId(id);
            setSelectedVersionIndex(index);
            setPanelUserClosed(false);
            markSeen(id, index);
        },
        [registry, markSeen]
    );

    useLayoutEffect(() => {
        if (!pendingArtifactPanelOpen || !lastMessage || lastMessage.role !== Role.Assistant) {
            return;
        }

        const artifact = lastAssistantCompleteArtifacts[0];
        if (!artifact) {
            return;
        }

        const versionIndex = getArtifactVersionIndexForMessage(registry, artifact.id, lastMessage.id);
        if (versionIndex === null) {
            return;
        }

        inFlightAssistantMessageIdRef.current = null;
        openArtifact(artifact.id, versionIndex, 'auto');
    }, [pendingArtifactPanelOpen, lastMessage, lastAssistantCompleteArtifacts, registry, openArtifact]);

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
                const wasViewingLatest = selectedVersionIndexRef.current === prevCount - 1;
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

    // As soon as a complete artifact resolves mid-generation, show it immediately rather than
    // waiting for the `openArtifact` effect above to run on the next commit.
    const pendingAutoOpenTarget = useMemo(() => {
        if (!pendingArtifactPanelOpen || !lastMessage || lastMessage.role !== Role.Assistant) {
            return null;
        }

        const artifact = lastAssistantCompleteArtifacts[0];
        if (!artifact) {
            return null;
        }

        const versionIndex = getArtifactVersionIndexForMessage(registry, artifact.id, lastMessage.id);
        if (versionIndex === null) {
            return null;
        }

        return { artifactId: artifact.id, versionIndex };
    }, [pendingArtifactPanelOpen, lastMessage, lastAssistantCompleteArtifacts, registry]);

    const buildParsedArtifact = useCallback(
        (artifactId: string, versionIndex: number): ParsedArtifact | null => {
            const entry = registry[artifactId];
            const version = entry?.versions[versionIndex];
            if (!entry || !version) {
                return null;
            }

            return {
                id: entry.id,
                type: entry.type,
                title: entry.title,
                language: version.language ?? entry.language,
                content: version.content,
            };
        },
        [registry]
    );

    const selectedEntry = selectedId ? registry[selectedId] : undefined;
    const selectedVersion = selectedEntry?.versions[selectedVersionIndex];
    const selectedArtifact: ParsedArtifact | null =
        selectedEntry && selectedVersion ? buildParsedArtifact(selectedId!, selectedVersionIndex) : null;

    const displayArtifact: ParsedArtifact | null =
        selectedArtifact ??
        (pendingAutoOpenTarget
            ? buildParsedArtifact(pendingAutoOpenTarget.artifactId, pendingAutoOpenTarget.versionIndex)
            : null);

    const isSelectedVersionProvisional =
        selectedId !== null
            ? isArtifactVersionProvisional(registry, selectedId, selectedVersionIndex)
            : pendingAutoOpenTarget !== null;

    const value = useMemo(
        () => ({
            registry,
            selectedArtifact: displayArtifact,
            selectedId,
            selectedVersionIndex,
            openArtifact,
            goToVersion,
            hasUnseenRevision,
            isPanelOpen: displayArtifact !== null || isLoadingPanelOpen,
            closePanel,
            isFullscreen,
            enterFullscreen,
            exitFullscreen,
            panelUserClosed,
            resetPanelUserClosed,
            isSelectedVersionProvisional,
            isArtifactGenerationLoading: artifactGenerationLoading,
            isArtifactRevisionLoading: artifactRevisionLoading,
            isLoadingPanelOpen,
        }),
        [
            registry,
            displayArtifact,
            selectedId,
            selectedVersionIndex,
            openArtifact,
            goToVersion,
            hasUnseenRevision,
            isLoadingPanelOpen,
            closePanel,
            isFullscreen,
            enterFullscreen,
            exitFullscreen,
            panelUserClosed,
            resetPanelUserClosed,
            isSelectedVersionProvisional,
            artifactGenerationLoading,
            artifactRevisionLoading,
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
