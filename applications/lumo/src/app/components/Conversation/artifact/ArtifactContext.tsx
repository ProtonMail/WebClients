import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { ParsedArtifact, StreamingArtifact } from './parseArtifacts';

interface ArtifactContextValue {
    // Fully generated artifact — renders with syntax highlighting / full markdown
    selectedArtifact: ParsedArtifact | null;
    setSelectedArtifact: (artifact: ParsedArtifact | null) => void;
    // In-progress artifact being streamed — renders as plain text preview
    streamingArtifact: StreamingArtifact | null;
    setStreamingArtifact: (artifact: StreamingArtifact | null) => void;
    // True when either artifact is present (controls panel visibility)
    isPanelOpen: boolean;
    closePanel: () => void;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

interface ArtifactProviderProps {
    children: ReactNode;
    conversationId?: string;
}

export const ArtifactProvider = ({ children, conversationId }: ArtifactProviderProps) => {
    const [selectedArtifact, setSelectedArtifact] = useState<ParsedArtifact | null>(null);
    const [streamingArtifact, setStreamingArtifact] = useState<StreamingArtifact | null>(null);

    // Reset both states when navigating to a different conversation
    useEffect(() => {
        setSelectedArtifact(null);
        setStreamingArtifact(null);
    }, [conversationId]);

    const closePanel = useCallback(() => {
        setSelectedArtifact(null);
        setStreamingArtifact(null);
    }, []);

    return (
        <ArtifactContext.Provider
            value={{
                selectedArtifact,
                setSelectedArtifact,
                streamingArtifact,
                setStreamingArtifact,
                isPanelOpen: selectedArtifact !== null || streamingArtifact !== null,
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
