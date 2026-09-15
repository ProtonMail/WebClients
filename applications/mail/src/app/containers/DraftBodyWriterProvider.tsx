import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import type { ComposerKeyedManager } from '../helpers/composer/composerKeyedManager';
import { createComposerKeyedManager } from '../helpers/composer/composerKeyedManager';

export interface DraftBodyWriter {
    /** Checked at call time: for HTML drafts the answer depends on current editor content. */
    preservesQuote: () => boolean;
    write: (body: string) => boolean;
}

export type DraftBodyWriterManager = ComposerKeyedManager<DraftBodyWriter>;

const DraftBodyWriterContext = createContext<DraftBodyWriterManager | undefined>(undefined);

export const useDraftBodyWriters = () => {
    const manager = useContext(DraftBodyWriterContext);

    if (!manager) {
        throw new Error('Component should be wrapped inside DraftBodyWriterProvider');
    }

    return manager;
};

/** No provider in EO or most composer tests — the publisher must tolerate its absence. */
export const useOptionalDraftBodyWriters = () => useContext(DraftBodyWriterContext);

/** Mounted above composers because consumers (e.g. Lumo) render as siblings, not children. Writes go through the editor, not the store — EditorWrapper overwrites store content after init. */
export const DraftBodyWriterProvider = ({ children }: { children: ReactNode }) => {
    const manager = useMemo(() => createComposerKeyedManager<DraftBodyWriter>(), []);

    return <DraftBodyWriterContext.Provider value={manager}>{children}</DraftBodyWriterContext.Provider>;
};
