/**
 * Reading a large file through costs one Lite question per part (see fileAnalysis.ts). Free users
 * and guests have a limited number of those, so before the reading starts we check that it fits.
 * When it does not, nothing is spent: the send stops and the chat explains why, with the upsell.
 *
 * Assumption (not visible from the client): the backend takes one question off `remaining_limits.lite`
 * for every Lite request, whether it is the main reply or a helper call.
 */
import { useSyncExternalStore } from 'react';

import { type ModelTier, getSelectedModelTier } from '../providers/modelTierConstants';
import type { ConversationId } from '../types';
import type { LumoRemainingLimits } from '../types-api';
import { getRemainingLimits, getRemainingLimitsRevision } from './usageLimitsStore';

/** Model tiers whose replies are taken from the Lite pool, like the file reading itself. */
const LITE_POOL_TIERS = new Set<string>(['lumo-lite', 'apertus-15']);

export type FileAnalysisShortfall = {
    fileNames: string[];
    /** Lite questions the reading and the reply need, at least. */
    needed: number;
    /** Lite questions the user has left. */
    remaining: number;
};

export class FileAnalysisLimitError extends Error {
    readonly shortfall: FileAnalysisShortfall;

    constructor(shortfall: FileAnalysisShortfall) {
        super('Not enough Lite questions left to read the file');
        this.name = 'FileAnalysisLimitError';
        this.shortfall = shortfall;
    }
}

export const isFileAnalysisLimitError = (error: unknown): error is FileAnalysisLimitError => {
    return error instanceof FileAnalysisLimitError;
};

/**
 * The shortfall when reading `fileNames` (taking `analysisCalls` model calls) and then replying would
 * need more Lite questions than are left; undefined when it fits, or when we cannot tell (Lumo Plus,
 * limits not known yet).
 */
export function findFileAnalysisShortfall({
    fileNames,
    analysisCalls,
    hasLumoPlus,
    modelTier,
    limits = getRemainingLimits(),
    alreadySpent = 0,
}: {
    fileNames: string[];
    analysisCalls: number;
    hasLumoPlus: boolean;
    /**
     * The tier the user picked. It is resolved to the tier the reply is actually sent with here, so the
     * composer and the send path agree; when that tier uses the Lite pool, the reply needs a question too.
     */
    modelTier?: ModelTier | 'auto';
    /** Remaining limits; the current ones by default (a component passes the ones it re-renders on). */
    limits?: LumoRemainingLimits | null;
    /** Lite questions this send has spent on reading that the limits do not include yet. */
    alreadySpent?: number;
}): FileAnalysisShortfall | undefined {
    if (hasLumoPlus || analysisCalls === 0) {
        return undefined;
    }
    const reported = limits?.lite;
    if (typeof reported !== 'number') {
        return undefined;
    }
    const remaining = Math.max(0, reported - alreadySpent);
    const sentTier = modelTier && modelTier !== 'auto' ? getSelectedModelTier(modelTier) : modelTier;
    const needed = analysisCalls + (sentTier && LITE_POOL_TIERS.has(sentTier) ? 1 : 0);
    if (needed <= remaining) {
        return undefined;
    }
    return { fileNames, needed, remaining };
}

/**
 * Checks each reading a send makes (and each merge of its notes) against the Lite questions left,
 * counting what the send has already spent. Returns the shortfall when the calls do not fit (nothing
 * is counted for them); otherwise counts them and returns undefined.
 *
 * Every round of the reply is its own request and reports fresh limits, which already take off what
 * the send spent before that request. So the count starts again whenever the limits change. That is
 * safe because readings never overlap a request: the pre-reading ends before the first round starts,
 * and analyze_file runs after a round's stream has closed. (Another chat streaming at the same time
 * could refresh the limits mid-reading; the next request's fresh limits correct that.)
 */
export function createFileAnalysisAllowance({
    hasLumoPlus,
    modelTier,
}: {
    hasLumoPlus: boolean;
    modelTier?: ModelTier | 'auto';
}): (fileNames: string[], analysisCalls: number) => FileAnalysisShortfall | undefined {
    let spent = 0;
    let countedSince = getRemainingLimitsRevision();
    return (fileNames, analysisCalls) => {
        const revision = getRemainingLimitsRevision();
        if (revision !== countedSince) {
            spent = 0;
            countedSince = revision;
        }
        const shortfall = findFileAnalysisShortfall({
            fileNames,
            analysisCalls,
            hasLumoPlus,
            modelTier,
            alreadySpent: spent,
        });
        if (!shortfall) {
            spent += analysisCalls;
        }
        return shortfall;
    };
}

/*
 * What the chat shows when a reading did not fit, per conversation, until dismissed or the next send.
 * `stopped`: the send was stopped before the pre-reading. `skipped`: the reply asked for a reading
 * (analyze_file) and answered without it.
 */

export type FileAnalysisLimitNotice = FileAnalysisShortfall & { stage: 'stopped' | 'skipped' };

type Listener = () => void;

let notices: Record<ConversationId, FileAnalysisLimitNotice> = {};
const listeners = new Set<Listener>();

const publish = () => {
    listeners.forEach((listener) => listener());
};

export function setFileAnalysisLimitNotice(
    conversationId: ConversationId,
    shortfall: FileAnalysisShortfall,
    stage: FileAnalysisLimitNotice['stage'] = 'stopped'
): void {
    notices = { ...notices, [conversationId]: { ...shortfall, stage } };
    publish();
}

export function clearFileAnalysisLimitNotice(conversationId: ConversationId): void {
    if (!(conversationId in notices)) {
        return;
    }
    const { [conversationId]: _cleared, ...rest } = notices;
    notices = rest;
    publish();
}

export function getFileAnalysisLimitNotice(
    conversationId: ConversationId | undefined
): FileAnalysisLimitNotice | undefined {
    return conversationId ? notices[conversationId] : undefined;
}

const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export function useFileAnalysisLimitNotice(
    conversationId: ConversationId | undefined
): FileAnalysisLimitNotice | undefined {
    return useSyncExternalStore(
        subscribe,
        () => {
            return getFileAnalysisLimitNotice(conversationId);
        },
        () => {
            return getFileAnalysisLimitNotice(conversationId);
        }
    );
}

/*
 * Debug View only: shows the composer card (and holds the send) as if a large file were staged, so the
 * card can be previewed without a real file or a low allowance. Not persisted.
 */

let debugStagedShortfall: FileAnalysisShortfall | undefined;

export function setDebugStagedFileAnalysisShortfall(shortfall: FileAnalysisShortfall | undefined): void {
    debugStagedShortfall = shortfall;
    publish();
}

export function useDebugStagedFileAnalysisShortfall(): FileAnalysisShortfall | undefined {
    return useSyncExternalStore(
        subscribe,
        () => {
            return debugStagedShortfall;
        },
        () => {
            return debugStagedShortfall;
        }
    );
}
