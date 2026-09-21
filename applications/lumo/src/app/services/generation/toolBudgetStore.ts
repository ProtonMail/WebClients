import type { ConversationId } from '../../types';

/**
 * A chain the transport suspended because it ran out of client-tool rounds (the shared round budget in
 * `callAssistant`).
 */
export type SuspendedChain = {
    conversationId: ConversationId;
    /** Carries the suspended chain on from the turns it ran out of rounds on. */
    resume: () => Promise<void>;
};

type Listener = () => void;

let suspendedChains: readonly SuspendedChain[] = [];
const listeners = new Set<Listener>();

function emit() {
    for (const listener of listeners) {
        listener();
    }
}

export function getSuspendedChains(): readonly SuspendedChain[] {
    return suspendedChains;
}

export function subscribeSuspendedChains(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** A newer suspension supersedes whatever that conversation was already holding. */
export function setSuspendedChain(suspension: SuspendedChain): void {
    suspendedChains = [
        ...suspendedChains.filter((entry) => entry.conversationId !== suspension.conversationId),
        suspension,
    ];
    emit();
}

export function clearSuspendedChain(conversationId: ConversationId): void {
    const next = suspendedChains.filter((entry) => entry.conversationId !== conversationId);
    if (next.length !== suspendedChains.length) {
        suspendedChains = next;
        emit();
    }
}

export function clearAllSuspendedChains(): void {
    if (suspendedChains.length > 0) {
        suspendedChains = [];
        emit();
    }
}
