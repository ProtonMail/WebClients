import { useMemo } from 'react';

import { useFlag } from '@proton/unleash/useFlag';

import { countAnalysisCalls } from '../features/client-tools/retrievalTool/fileAnalysis';
import { splitIntoPages } from '../features/client-tools/retrievalTool/pages';
import { selectFilesToAnalyze } from '../features/client-tools/retrievalTool/prefetchAnalysis';
import { useLumoPlan } from '../providers/LumoPlanProvider';
import { useOptionalModelTier } from '../providers/ModelTierProvider';
import type { ModelTier } from '../providers/modelTierConstants';
import {
    type FileAnalysisShortfall,
    findFileAnalysisShortfall,
    useDebugStagedFileAnalysisShortfall,
} from '../services/fileAnalysisAllowance';
import { useRemainingLimits } from '../services/usageLimitsStore';
import type { Attachment } from '../types';
import type { LumoRemainingLimits } from '../types-api';

const NO_EXCLUSIONS = { attachmentIds: new Set<string>(), documentIds: new Set<string>() };

// The composer re-renders on every keystroke and its attachment list is a new array each time, but
// the attachment objects themselves are the same until they change: split each file's text once.
const callsByAttachment = new WeakMap<Attachment, number>();

const readingCalls = (file: Attachment): number => {
    let calls = callsByAttachment.get(file);
    if (calls === undefined) {
        calls = countAnalysisCalls(splitIntoPages(file.markdown!).length);
        callsByAttachment.set(file, calls);
    }
    return calls;
};

/**
 * The shortfall for files staged in the composer: the large ones the send would read through
 * (the same choice the send makes, see selectFilesToAnalyze), against the Lite questions left.
 * Files still processing have no text yet and are not counted until they are ready. Without the
 * retrieval tools the send does not read files through, so nothing is held.
 */
export function findStagedFileAnalysisShortfall({
    stagedAttachments,
    retrievalTools,
    hasLumoPlus,
    modelTier,
    limits,
}: {
    stagedAttachments: Attachment[];
    retrievalTools: boolean;
    hasLumoPlus: boolean;
    modelTier?: ModelTier | 'auto';
    limits: LumoRemainingLimits | null;
}): FileAnalysisShortfall | undefined {
    if (!retrievalTools) {
        return undefined;
    }
    const files = selectFilesToAnalyze({
        chatAttachments: stagedAttachments,
        exclusions: NO_EXCLUSIONS,
        message: {
            content: '',
            attachmentIds: stagedAttachments.map((attachment) => {
                return attachment.id;
            }),
        },
    });
    return findFileAnalysisShortfall({
        fileNames: files.map((file) => {
            return file.filename;
        }),
        analysisCalls: files.reduce((total, file) => {
            return total + readingCalls(file);
        }, 0),
        hasLumoPlus,
        modelTier,
        limits,
    });
}

/** Live version for the composer: updates as files finish processing, the model changes, or limits change. */
export function useStagedFileAnalysisShortfall(stagedAttachments: Attachment[]): FileAnalysisShortfall | undefined {
    const retrievalTools = useFlag('LumoRetrievalTools');
    const { hasLumoPlus } = useLumoPlan();
    const modelTierContext = useOptionalModelTier();
    const modelTier = modelTierContext?.modelTier;
    const limits = useRemainingLimits();
    const debugShortfall = useDebugStagedFileAnalysisShortfall();

    const shortfall = useMemo(() => {
        return findStagedFileAnalysisShortfall({ stagedAttachments, retrievalTools, hasLumoPlus, modelTier, limits });
    }, [stagedAttachments, retrievalTools, hasLumoPlus, modelTier, limits]);
    return debugShortfall ?? shortfall;
}
