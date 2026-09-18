import type { ChallengeResult } from '../shared/interface';

export type { ChallengeLog, ChallengeLogType, ChallengeResult } from '../shared/interface';

export interface ChallengeRef {
    getChallenge: () => Promise<ChallengeResult>;
    sendEvent: (event: ChallengeEvent) => void;
}

export type ChallengeEventType =
    'keydown' | 'keyup' | 'input' | 'change' | 'focus' | 'blur' | 'click' | 'paste' | 'copy' | 'cut';

/** Structured-cloneable wire shape for `postMessage`. */
export interface ChallengeEvent {
    type: ChallengeEventType;
    id: string;
    time: number;
    isTrusted: boolean;
    tag?: string;
    inputType?: string;
    key?: string;
    repeat?: boolean;
    value?: string;
    length?: number;
    selectionStart?: number;
    selectionEnd?: number;
}
